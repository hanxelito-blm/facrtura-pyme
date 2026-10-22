'use strict';

const clienteService = require('../services/clienteService');

class ClienteController {
  async listar(_req, res, next) {
    try {
      const clientes = await clienteService.listar();
      res.status(200).json(clientes);
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.obtenerPorId(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.status(200).json(cliente);
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nuevo = await clienteService.crear(req.body);
      res.status(201).json(nuevo);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const actualizado = await clienteService.actualizar(id, req.body);
      res.status(200).json(actualizado);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await clienteService.eliminar(id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClienteController();
