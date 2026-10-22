'use strict';

const express = require('express');
const router = express.Router();
const resumenController = require('../controllers/resumenController');

router.get('/', (req, res, next) => resumenController.obtenerResumen(req, res, next));

module.exports = router;
