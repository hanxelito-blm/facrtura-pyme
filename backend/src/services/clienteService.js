'use strict';

const db = require('../db');

/**
 * Servicio para gestión de Clientes
 */
class ClienteService {
  async listar() {
    return db.all('SELECT * FROM clientes ORDER BY id DESC');
  }

  async obtenerPorId(id) {
    const cliente = await db.get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!cliente) return null;

    // Obtener también el historial de facturas de este cliente (datos relacionados)
    const facturas = await db.all(
      'SELECT id, folio, fecha_emision, fecha_vencimiento, estado, total FROM facturas WHERE cliente_id = ? ORDER BY id DESC',
      [id]
    );

    return { ...cliente, facturas };
  }

  async crear(data) {
    const { nombre, email, telefono, direccion, rfc } = data;

    if (!nombre || !email) {
      const err = new Error('El nombre y el email son obligatorios');
      err.status = 400;
      throw err;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error('El formato del email no es válido');
      err.status = 400;
      throw err;
    }

    // Verificar si ya existe el email
    const existente = await db.get('SELECT id FROM clientes WHERE email = ?', [email]);
    if (existente) {
      const err = new Error('Ya existe un cliente registrado con ese email');
      err.status = 409;
      throw err;
    }

    if (rfc) {
      const rfcExistente = await db.get('SELECT id FROM clientes WHERE rfc = ?', [rfc]);
      if (rfcExistente) {
        const err = new Error('Ya existe un cliente con ese RFC');
        err.status = 409;
        throw err;
      }
    }

    const result = await db.run(
      `INSERT INTO clientes (nombre, email, telefono, direccion, rfc, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre.trim(), email.trim().toLowerCase(), telefono || null, direccion || null, rfc || null]
    );

    return db.get('SELECT * FROM clientes WHERE id = ?', [result.lastID]);
  }

  async actualizar(id, data) {
    const actual = await db.get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!actual) {
      const err = new Error('Cliente no encontrado');
      err.status = 404;
      throw err;
    }

    const { nombre, email, telefono, direccion, rfc, activo } = data;

    if (email && email !== actual.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const err = new Error('El formato del email no es válido');
        err.status = 400;
        throw err;
      }
      const duplicado = await db.get('SELECT id FROM clientes WHERE email = ? AND id != ?', [email, id]);
      if (duplicado) {
        const err = new Error('El email ya pertenece a otro cliente');
        err.status = 409;
        throw err;
      }
    }

    await db.run(
      `UPDATE clientes SET
        nombre = ?,
        email = ?,
        telefono = ?,
        direccion = ?,
        rfc = ?,
        activo = ?
       WHERE id = ?`,
      [
        nombre !== undefined ? nombre.trim() : actual.nombre,
        email !== undefined ? email.trim().toLowerCase() : actual.email,
        telefono !== undefined ? telefono : actual.telefono,
        direccion !== undefined ? direccion : actual.direccion,
        rfc !== undefined ? rfc : actual.rfc,
        activo !== undefined ? (activo ? 1 : 0) : actual.activo,
        id
      ]
    );

    return db.get('SELECT * FROM clientes WHERE id = ?', [id]);
  }

  async eliminar(id) {
    const actual = await db.get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!actual) {
      const err = new Error('Cliente no encontrado');
      err.status = 404;
      throw err;
    }

    // Verificar si tiene facturas asociadas
    const facturas = await db.get('SELECT COUNT(*) as count FROM facturas WHERE cliente_id = ?', [id]);
    if (facturas.count > 0) {
      const err = new Error('No se puede eliminar el cliente porque tiene facturas registradas. Puedes desactivarlo.');
      err.status = 409;
      throw err;
    }

    await db.run('DELETE FROM clientes WHERE id = ?', [id]);
    return { mensaje: 'Cliente eliminado correctamente' };
  }
}

module.exports = new ClienteService();
