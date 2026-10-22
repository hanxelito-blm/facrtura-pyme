'use strict';

const db = require('../db');

/**
 * Servicio de Resumen y Métricas analíticas con SQL (COUNT, SUM, GROUP BY)
 */
class ResumenService {
  async obtenerIndicadores() {
    // 1. Métricas generales de facturación
    const metricasFacturas = await db.get(
      `SELECT
         COUNT(*) AS total_facturas,
         COALESCE(SUM(total), 0) AS total_monto_facturado,
         COALESCE(SUM(CASE WHEN estado = 'pagada' THEN total ELSE 0 END), 0) AS total_pagado,
         COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN total ELSE 0 END), 0) AS total_pendiente,
         COALESCE(SUM(CASE WHEN estado = 'cancelada' THEN total ELSE 0 END), 0) AS total_cancelado
       FROM facturas`
    );

    // 2. Desglose de facturas agrupadas por estado (GROUP BY + COUNT + SUM)
    const porEstado = await db.all(
      `SELECT
         estado,
         COUNT(*) AS cantidad,
         COALESCE(SUM(total), 0) AS monto_total
       FROM facturas
       GROUP BY estado
       ORDER BY cantidad DESC`
    );

    // 3. Métricas de clientes
    const metricasClientes = await db.get(
      `SELECT
         COUNT(*) AS total_clientes,
         COALESCE(SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END), 0) AS clientes_activos
       FROM clientes`
    );

    // 4. Métricas de productos e inventario
    const metricasProductos = await db.get(
      `SELECT
         COUNT(*) AS total_productos,
         COALESCE(SUM(stock), 0) AS stock_total_unidades,
         COALESCE(SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END), 0) AS productos_bajo_stock
       FROM productos
       WHERE activo = 1`
    );

    // 5. Top productos más vendidos (SUM + GROUP BY + JOIN + ORDER BY)
    const topProductos = await db.all(
      `SELECT
         p.id,
         p.nombre,
         p.unidad,
         COALESCE(SUM(lf.cantidad), 0) AS unidades_vendidas,
         COALESCE(SUM(lf.subtotal), 0) AS total_ingresos
       FROM lineas_factura lf
       JOIN productos p ON p.id = lf.producto_id
       JOIN facturas f ON f.id = lf.factura_id
       WHERE f.estado != 'cancelada'
       GROUP BY p.id, p.nombre, p.unidad
       ORDER BY unidades_vendidas DESC
       LIMIT 5`
    );

    // 6. Últimas facturas emitidas
    const ultimasFacturas = await db.all(
      `SELECT
         f.id,
         f.folio,
         c.nombre AS cliente_nombre,
         f.fecha_emision,
         f.estado,
         f.total
       FROM facturas f
       JOIN clientes c ON c.id = f.cliente_id
       ORDER BY f.id DESC
       LIMIT 5`
    );

    return {
      metricas: {
        totalFacturas: metricasFacturas.total_facturas,
        totalMontoFacturado: Number(metricasFacturas.total_monto_facturado.toFixed(2)),
        totalPagado: Number(metricasFacturas.total_pagado.toFixed(2)),
        totalPendiente: Number(metricasFacturas.total_pendiente.toFixed(2)),
        totalCancelado: Number(metricasFacturas.total_cancelado.toFixed(2)),
        totalClientes: metricasClientes.total_clientes,
        clientesActivos: metricasClientes.clientes_activos,
        totalProductos: metricasProductos.total_productos,
        stockTotal: metricasProductos.stock_total_unidades,
        productosBajoStock: metricasProductos.productos_bajo_stock
      },
      porEstado,
      topProductos,
      ultimasFacturas
    };
  }
}

module.exports = new ResumenService();
