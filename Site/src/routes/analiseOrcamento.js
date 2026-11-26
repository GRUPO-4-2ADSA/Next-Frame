var express = require("express");
var router = express.Router();

var analiseOrcamentoController = require("../controllers/analiseOrcamentoController");

router.post("/analisar", analiseOrcamentoController.analisarOrcamento);

module.exports = router;
