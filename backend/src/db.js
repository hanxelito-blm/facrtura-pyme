'use strict';

const path    = require('path');
const fs      = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/facturacion.db';
const SCHEMA  = path.resolve(__dirname, '..', 'schema.sql');

// Asegurar que exista la carpeta data/
const dataDir = path.resolve(path.dirname(DB_PATH));
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Singleton de conexión
let _db = null;

/**
 * Abre (o reutiliza) la conexión SQLite.
 * @returns {Promise<import('sqlite').Database>}
 */
async function getDb() {
  if (_db) return _db;

  _db = await open({
    filename: DB_PATH,
    driver:   sqlite3.Database,
  });

  // Buenas prácticas de rendimiento e integridad
  await _db.exec(`PRAGMA journal_mode = WAL`);
  await _db.exec(`PRAGMA foreign_keys = ON`);

  console.log(`[db] SQLite conectado → ${DB_PATH}`);

  // Aplicar el schema si existe
  if (fs.existsSync(SCHEMA)) {
    const sql = fs.readFileSync(SCHEMA, 'utf8');
    await _db.exec(sql);
    console.log('[db] Schema aplicado correctamente');
  }

  return _db;
}

/**
 * Ejecuta una consulta y devuelve todas las filas.
 * Uso: const rows = await db.all('SELECT * FROM clientes WHERE id = ?', [id]);
 */
const all = async (sql, params = []) => {
  const db = await getDb();
  return db.all(sql, params);
};

/**
 * Ejecuta una consulta y devuelve una sola fila.
 */
const get = async (sql, params = []) => {
  const db = await getDb();
  return db.get(sql, params);
};

/**
 * Ejecuta INSERT / UPDATE / DELETE. Devuelve { lastID, changes }.
 */
const run = async (sql, params = []) => {
  const db = await getDb();
  return db.run(sql, params);
};

/**
 * Ejecuta múltiples sentencias SQL (schema, migraciones, etc.).
 */
const exec = async (sql) => {
  const db = await getDb();
  return db.exec(sql);
};

/**
 * Abre una transacción manual.
 * Patrón:
 *   await db.run('BEGIN');
 *   try {
 *     await db.run(...); await db.run(...);
 *     await db.run('COMMIT');
 *   } catch (e) {
 *     await db.run('ROLLBACK');
 *     throw e;
 *   }
 */

/**
 * Prueba de conectividad.
 */
const ping = async () => {
  const row = await get(`SELECT datetime('now') AS ts`);
  console.log(`[db] Ping OK — ${row.ts}`);
  return true;
};

/**
 * Cierra la conexión de forma ordenada.
 */
const end = async () => {
  if (_db) {
    await _db.close();
    _db = null;
    console.log('[db] Conexión cerrada');
  }
};

module.exports = { getDb, all, get, run, exec, ping, end };
