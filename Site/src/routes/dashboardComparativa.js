
var express = require("express");
var router = express.Router();

var dashboardComparativaController = require("../controllers/dashboardComparativaController");

router.get("/dados/:idAvaliacao/:idUsuario", dashboardComparativaController.buscarDadosComparativa);

module.exports = router;
