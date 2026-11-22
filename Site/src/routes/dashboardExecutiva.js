let express = require("express");
let router = express.Router();

let dashboardExecutivaController = require("../controllers/dashboardExecutivaController");

router.get("/kpi-risco", function (req, res) {
    dashboardExecutivaController.kpiRisco(req, res);
});

router.get("/kpi-roi-mediano", function (req, res) {
    dashboardExecutivaController.kpiRoiMediano(req, res);
});

module.exports = router;