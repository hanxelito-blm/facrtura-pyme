'use strict';

const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

router.get('/', (req, res, next) => facturaController.listar(req, res, next));
router.get('/:id', (req, res, next) => facturaController.obtenerPorId(req, res, next));
router.post('/', (req, res, next) => facturaController.crear(req, res, next));
router.patch('/:id/estado', (req, res, next) => facturaController.cambiarEstado(req, res, next));
router.delete('/:id', (req, res, next) => facturaController.eliminar(req, res, next));

module.exports = router;
