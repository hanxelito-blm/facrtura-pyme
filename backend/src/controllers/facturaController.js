'use strict';

const facturaService = require('../services/facturaService');

class FacturaController {
  async listar(_req, res, next) {
    try {
      const facturas = await facturaService.listar();
      res.status(200).json(facturas);
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const factura = await facturaService.obtenerPorId(id);
      if (!factura) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }
      res.status(200).json(factura);
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nueva = await facturaService.crear(req.body);
      res.status(201).json(nueva);
    } catch (err) {
      next(err);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      if (!estado) {
        return res.status(400).json({ error: 'El campo "estado" es obligatorio' });
      }
      const actualizada = await facturaService.cambiarEstado(id, estado);
      res.status(200).json(actualizada);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await facturaService.eliminar(id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FacturaController();
