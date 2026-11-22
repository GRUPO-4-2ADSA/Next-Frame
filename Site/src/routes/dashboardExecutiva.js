let express = require("express");
let router = express.Router();

let dashboardExecutivaController = require("../controllers/dashboardExecutivaController");

router.get("/kpi-risco", function (req, res) {
    dashboardExecutivaController.kpiRisco(req, res);
});

module.exports = router;