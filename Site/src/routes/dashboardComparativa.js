
var express = require("express");
var router = express.Router();

var dashboardComparativaController = require("../controllers/dashboardComparativaController");
var googleTrendsController = require("../controllers/googleTrendsController");

router.get("/dados/:idAvaliacao/:idUsuario", dashboardComparativaController.buscarDadosComparativa);
router.get("/googleTrends/:idAvaliacao/:idUsuario", googleTrendsController.buscarDadosGoogleTrends);

module.exports = router;
