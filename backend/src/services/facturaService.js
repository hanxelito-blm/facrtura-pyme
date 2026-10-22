'use strict';

const db = require('../db');

/**
 * Servicio para Facturas con soporte estricto de Transacciones SQL
 */
class FacturaService {
  async listar() {
    return db.all(
      `SELECT
         f.id,
         f.folio,
         f.cliente_id,
         c.nombre AS cliente_nombre,
         c.email AS cliente_email,
         c.rfc AS cliente_rfc,
         f.fecha_emision,
         f.fecha_vencimiento,
         f.estado,
         f.subtotal,
         f.impuesto_pct,
         f.total,
         f.notas,
         (SELECT COUNT(*) FROM lineas_factura WHERE factura_id = f.id) AS total_items
       FROM facturas f
       JOIN clientes c ON c.id = f.cliente_id
       ORDER BY f.id DESC`
    );
  }

  async obtenerPorId(id) {
    const factura = await db.get(
      `SELECT
         f.id,
         f.folio,
         f.cliente_id,
         c.nombre AS cliente_nombre,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,
         c.direccion AS cliente_direccion,
         c.rfc AS cliente_rfc,
         f.fecha_emision,
         f.fecha_vencimiento,
         f.estado,
         f.subtotal,
         f.impuesto_pct,
         f.total,
         f.notas,
         f.creado_en
       FROM facturas f
       JOIN clientes c ON c.id = f.cliente_id
       WHERE f.id = ?`,
      [id]
    );

    if (!factura) return null;

    // Obtener las líneas detalladas con datos del producto
    const lineas = await db.all(
      `SELECT
         lf.id,
         lf.producto_id,
         p.nombre AS producto_nombre,
         p.unidad AS producto_unidad,
         lf.cantidad,
         lf.precio_unitario,
         lf.descuento_pct,
         lf.subtotal
       FROM lineas_factura lf
       JOIN productos p ON p.id = lf.producto_id
       WHERE lf.factura_id = ?
       ORDER BY lf.id ASC`,
      [id]
    );

    return { ...factura, lineas };
  }

  /**
   * Crea una factura con sus líneas dentro de una TRANSACCIÓN SQL.
   * Descuenta stock de los productos involucrados.
   * Si falta stock o ocurre cualquier error, hace ROLLBACK total.
   */
  async crear(data) {
    const { cliente_id, fecha_vencimiento, lineas, impuesto_pct = 16, notas } = data;

    if (!cliente_id) {
      const err = new Error('El cliente_id es obligatorio');
      err.status = 400;
      throw err;
    }

    if (!lineas || !Array.isArray(lineas) || lineas.length === 0) {
      const err = new Error('La factura debe incluir al menos una línea de producto');
      err.status = 400;
      throw err;
    }

    const database = await db.getDb();

    // Iniciar Transacción SQL
    await database.exec('BEGIN TRANSACTION');

    try {
      // 1. Validar que el cliente exista y esté activo
      const cliente = await database.get('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
      if (!cliente) {
        const err = new Error('El cliente especificado no existe');
        err.status = 404;
        throw err;
      }
      if (!cliente.activo) {
        const err = new Error('El cliente especificado se encuentra inactivo');
        err.status = 409;
        throw err;
      }

      // 2. Generar Folio correlativo único
      const fechaActual = new Date();
      const anio = fechaActual.getFullYear();
      const ultimaFactura = await database.get(
        `SELECT folio FROM facturas WHERE folio LIKE 'F-${anio}-%' ORDER BY id DESC LIMIT 1`
      );

      let consecutivo = 1;
      if (ultimaFactura && ultimaFactura.folio) {
        const partes = ultimaFactura.folio.split('-');
        consecutivo = (parseInt(partes[2], 10) || 0) + 1;
      }
      const folio = `F-${anio}-${String(consecutivo).padStart(4, '0')}`;

      // 3. Validar productos y verificar stock disponible
      let subtotalCalculado = 0;
      const lineasValidadas = [];

      for (const item of lineas) {
        const { producto_id, cantidad, descuento_pct = 0 } = item;

        if (!producto_id || cantidad === undefined || Number(cantidad) <= 0) {
          const err = new Error('Cada ítem debe tener producto_id válido y cantidad mayor a 0');
          err.status = 400;
          throw err;
        }

        const prod = await database.get('SELECT * FROM productos WHERE id = ?', [producto_id]);
        if (!prod) {
          const err = new Error(`El producto con ID ${producto_id} no existe`);
          err.status = 404;
          throw err;
        }

        if (!prod.activo) {
          const err = new Error(`El producto "${prod.nombre}" está marcado como inactivo`);
          err.status = 409;
          throw err;
        }

        const cantNum = Number(cantidad);
        if (prod.stock < cantNum) {
          const err = new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, Solicitado: ${cantNum}`);
          err.status = 409;
          throw err;
        }

        const precioUnitario = Number(item.precio_unitario !== undefined ? item.precio_unitario : prod.precio);
        const descNum = Number(descuento_pct) || 0;
        const subtotalLinea = Math.round(cantNum * precioUnitario * (1 - descNum / 100) * 100) / 100;

        subtotalCalculado += subtotalLinea;

        lineasValidadas.push({
          producto_id,
          cantidad: cantNum,
          precio_unitario: precioUnitario,
          descuento_pct: descNum,
          nuevo_stock: prod.stock - cantNum
        });
      }

      // 4. Calcular totales
      const impPct = Number(impuesto_pct) || 0;
      const totalCalculado = Math.round(subtotalCalculado * (1 + impPct / 100) * 100) / 100;
      const fechaVenc = fecha_vencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 5. Insertar cabecera de la factura
      const factResult = await database.run(
        `INSERT INTO facturas (folio, cliente_id, fecha_vencimiento, estado, subtotal, impuesto_pct, total, notas)
         VALUES (?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
        [folio, cliente_id, fechaVenc, subtotalCalculado, impPct, totalCalculado, notas || null]
      );
      const facturaId = factResult.lastID;

      // 6. Insertar líneas y actualizar stock de cada producto
      for (const linea of lineasValidadas) {
        await database.run(
          `INSERT INTO lineas_factura (factura_id, producto_id, cantidad, precio_unitario, descuento_pct)
           VALUES (?, ?, ?, ?, ?)`,
          [facturaId, linea.producto_id, linea.cantidad, linea.precio_unitario, linea.descuento_pct]
        );

        // Descontar stock
        await database.run(
          `UPDATE productos SET stock = ? WHERE id = ?`,
          [linea.nuevo_stock, linea.producto_id]
        );
      }

      // Confirmar transacción
      await database.exec('COMMIT');

      // Devolver factura completa
      return this.obtenerPorId(facturaId);
    } catch (err) {
      // Revertir ante cualquier error
      await database.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Cambiar estado de factura (pendiente, pagada, cancelada).
   * Si se cancela, se repone el stock automáticamente en una transacción.
   */
  async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ['pendiente', 'pagada', 'cancelada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      const err = new Error(`Estado inválido. Opciones: ${estadosValidos.join(', ')}`);
      err.status = 400;
      throw err;
    }

    const factura = await this.obtenerPorId(id);
    if (!factura) {
      const err = new Error('Factura no encontrada');
      err.status = 404;
      throw err;
    }

    if (factura.estado === nuevoEstado) {
      return factura;
    }

    const database = await db.getDb();
    await database.exec('BEGIN TRANSACTION');

    try {
      // Si pasa a cancelada y no estaba cancelada, reponer stock
      if (nuevoEstado === 'cancelada' && factura.estado !== 'cancelada') {
        for (const linea of factura.lineas) {
          await database.run(
            'UPDATE productos SET stock = stock + ? WHERE id = ?',
            [linea.cantidad, linea.producto_id]
          );
        }
      }

      // Si estaba cancelada y se reactiva a pendiente/pagada, verificar y descontar stock
      if (factura.estado === 'cancelada' && nuevoEstado !== 'cancelada') {
        for (const linea of factura.lineas) {
          const prod = await database.get('SELECT stock, nombre FROM productos WHERE id = ?', [linea.producto_id]);
          if (prod.stock < linea.cantidad) {
            const err = new Error(`No se puede reactivar: stock insuficiente de "${prod.nombre}"`);
            err.status = 409;
            throw err;
          }
          await database.run(
            'UPDATE productos SET stock = stock - ? WHERE id = ?',
            [linea.cantidad, linea.producto_id]
          );
        }
      }

      await database.run('UPDATE facturas SET estado = ? WHERE id = ?', [nuevoEstado, id]);
      await database.exec('COMMIT');

      return this.obtenerPorId(id);
    } catch (err) {
      await database.exec('ROLLBACK');
      throw err;
    }
  }

  async eliminar(id) {
    const factura = await this.obtenerPorId(id);
    if (!factura) {
      const err = new Error('Factura no encontrada');
      err.status = 404;
      throw err;
    }

    const database = await db.getDb();
    await database.exec('BEGIN TRANSACTION');

    try {
      // Si la factura no estaba cancelada, regresar el stock al eliminarla
      if (factura.estado !== 'cancelada') {
        for (const linea of factura.lineas) {
          await database.run(
            'UPDATE productos SET stock = stock + ? WHERE id = ?',
            [linea.cantidad, linea.producto_id]
          );
        }
      }

      await database.run('DELETE FROM lineas_factura WHERE factura_id = ?', [id]);
      await database.run('DELETE FROM facturas WHERE id = ?', [id]);

      await database.exec('COMMIT');
      return { mensaje: 'Factura eliminada correctamente' };
    } catch (err) {
      await database.exec('ROLLBACK');
      throw err;
    }
  }
}

module.exports = new FacturaService();
