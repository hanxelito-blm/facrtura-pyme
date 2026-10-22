'use strict';

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', (req, res, next) => clienteController.listar(req, res, next));
router.get('/:id', (req, res, next) => clienteController.obtenerPorId(req, res, next));
router.post('/', (req, res, next) => clienteController.crear(req, res, next));
router.put('/:id', (req, res, next) => clienteController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => clienteController.eliminar(req, res, next));

module.exports = router;
