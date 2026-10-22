'use strict';

const productoService = require('../services/productoService');

class ProductoController {
  async listar(_req, res, next) {
    try {
      const productos = await productoService.listar();
      res.status(200).json(productos);
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const producto = await productoService.obtenerPorId(id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.status(200).json(producto);
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nuevo = await productoService.crear(req.body);
      res.status(201).json(nuevo);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const actualizado = await productoService.actualizar(id, req.body);
      res.status(200).json(actualizado);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await productoService.eliminar(id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductoController();
