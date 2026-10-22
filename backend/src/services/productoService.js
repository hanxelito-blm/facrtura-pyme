'use strict';

const db = require('../db');

/**
 * Servicio para gestión de Productos
 */
class ProductoService {
  async listar() {
    return db.all('SELECT * FROM productos ORDER BY id DESC');
  }

  async obtenerPorId(id) {
    const producto = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    if (!producto) return null;

    // Obtener estadísticas de ventas del producto (datos relacionados)
    const stats = await db.get(
      `SELECT
         COALESCE(SUM(lf.cantidad), 0) AS total_unidades_vendidas,
         COALESCE(SUM(lf.subtotal), 0) AS total_recaudado,
         COUNT(DISTINCT lf.factura_id) AS total_facturas_incluido
       FROM lineas_factura lf
       WHERE lf.producto_id = ?`,
      [id]
    );

    return { ...producto, stats };
  }

  async crear(data) {
    const { nombre, descripcion, precio, stock, unidad } = data;

    if (!nombre || precio === undefined) {
      const err = new Error('El nombre y el precio son obligatorios');
      err.status = 400;
      throw err;
    }

    const numPrecio = Number(precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      const err = new Error('El precio debe ser un número mayor a 0');
      err.status = 400;
      throw err;
    }

    const numStock = stock !== undefined ? Number(stock) : 0;
    if (isNaN(numStock) || numStock < 0) {
      const err = new Error('El stock no puede ser un número negativo');
      err.status = 400;
      throw err;
    }

    const result = await db.run(
      `INSERT INTO productos (nombre, descripcion, precio, stock, unidad, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre.trim(), descripcion || null, numPrecio, numStock, unidad || 'pieza']
    );

    return db.get('SELECT * FROM productos WHERE id = ?', [result.lastID]);
  }

  async actualizar(id, data) {
    const actual = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    if (!actual) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }

    const { nombre, descripcion, precio, stock, unidad, activo } = data;

    let numPrecio = actual.precio;
    if (precio !== undefined) {
      numPrecio = Number(precio);
      if (isNaN(numPrecio) || numPrecio <= 0) {
        const err = new Error('El precio debe ser un número mayor a 0');
        err.status = 400;
        throw err;
      }
    }

    let numStock = actual.stock;
    if (stock !== undefined) {
      numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        const err = new Error('El stock no puede ser un número negativo');
        err.status = 400;
        throw err;
      }
    }

    await db.run(
      `UPDATE productos SET
        nombre = ?,
        descripcion = ?,
        precio = ?,
        stock = ?,
        unidad = ?,
        activo = ?
       WHERE id = ?`,
      [
        nombre !== undefined ? nombre.trim() : actual.nombre,
        descripcion !== undefined ? descripcion : actual.descripcion,
        numPrecio,
        numStock,
        unidad !== undefined ? unidad : actual.unidad,
        activo !== undefined ? (activo ? 1 : 0) : actual.activo,
        id
      ]
    );

    return db.get('SELECT * FROM productos WHERE id = ?', [id]);
  }

  async eliminar(id) {
    const actual = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    if (!actual) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }

    // Verificar si está referenciado en alguna línea de factura
    const lineas = await db.get('SELECT COUNT(*) as count FROM lineas_factura WHERE producto_id = ?', [id]);
    if (lineas.count > 0) {
      const err = new Error('No se puede eliminar el producto porque está presente en facturas emitidas. Puedes desactivarlo.');
      err.status = 409;
      throw err;
    }

    await db.run('DELETE FROM productos WHERE id = ?', [id]);
    return { mensaje: 'Producto eliminado correctamente' };
  }
}

module.exports = new ProductoService();
