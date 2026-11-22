let express = require("express");
let router = express.Router();
let dashboardController = require("../controllers/dashboardController");

router.get("/kpi-risco", dashboardController.kpiRisco);

module.exports = router;