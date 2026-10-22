'use strict';

const resumenService = require('../services/resumenService');

class ResumenController {
  async obtenerResumen(_req, res, next) {
    try {
      const data = await resumenService.obtenerIndicadores();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ResumenController();
