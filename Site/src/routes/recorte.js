var express = require("express");
var router = express.Router();

var recorteController = require("../controllers/recorteController");

router.post("/receita-mediana", recorteController.buscarReceitaMediana);

module.exports = router;