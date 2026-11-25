var express = require("express");
var router = express.Router();
var dashboardExecutivaController = require("../controllers/dashboardExecutivaController");

router.get("/roi-mediano-por-periodo", dashboardExecutivaController.roiMedianoPorPeriodo);

module.exports = router;
