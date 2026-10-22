'use strict';

const path    = require('path');
const fs      = require('fs');
const express = require('express');
const db      = require('./db');

// Importar rutas modulares
const clienteRoutes  = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const facturaRoutes  = require('./routes/facturaRoutes');
const resumenRoutes  = require('./routes/resumenRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await db.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ error: 'Base de datos no disponible' });
  }
});

// ── Rutas de la API REST ────────────────────────────────────────────────────
app.use('/api/clientes',  clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/facturas',  facturaRoutes);
app.use('/api/resumen',   resumenRoutes);

// Servir frontend estático compilado
const distDir   = path.resolve(__dirname, '..', 'frontend', 'dist');
const publicDir = path.resolve(__dirname, '..', 'public');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Endpoint informativo si no hay frontend compilado
app.get('/api', (_req, res) => {
  res.json({
    nombre: 'FacturaPyME API',
    version: '1.0.0',
    endpoints: {
      health:    'GET /api/health',
      resumen:   'GET /api/resumen',
      clientes:  'GET, POST /api/clientes | GET, PUT, DELETE /api/clientes/:id',
      productos: 'GET, POST /api/productos | GET, PUT, DELETE /api/productos/:id',
      facturas:  'GET, POST /api/facturas | GET, DELETE /api/facturas/:id | PATCH /api/facturas/:id/estado',
    }
  });
});

// Para Single Page Applications (SPA), redirigir rutas no-API al index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexDist = path.join(distDir, 'index.html');
    const indexPublic = path.join(publicDir, 'index.html');

    if (fs.existsSync(indexDist)) {
      return res.sendFile(indexDist);
    }
    if (fs.existsSync(indexPublic)) {
      return res.sendFile(indexPublic);
    }
  }
  next();
});

// ── 404 para rutas de API no encontradas ────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// ── Manejador de errores global con formato estricto: { "error": "mensaje" } ──
app.use((err, _req, res, _next) => {
  console.error('[server error]', err.message || err);
  const status = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';
  res.status(status).json({ error: mensaje });
});

// ── Inicialización y arranque ───────────────────────────────────────────────
const iniciarServidor = async () => {
  try {
    // Inicializar conexión a base de datos y esquema
    await db.getDb();

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Servidor backend activo en http://localhost:${PORT}`);
      console.log(`📊 API Resumen:     http://localhost:${PORT}/api/resumen`);
      console.log(`🧾 API Facturas:    http://localhost:${PORT}/api/facturas`);
      console.log(`👥 API Clientes:    http://localhost:${PORT}/api/clientes`);
      console.log(`📦 API Productos:   http://localhost:${PORT}/api/productos`);
      console.log(`💻 Aplicación Web:  http://localhost:${PORT}`);
      console.log(`======================================================\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} recibido. Cerrando servidor…`);
      server.close(async () => {
        await db.end();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  iniciarServidor();
}

module.exports = app;
