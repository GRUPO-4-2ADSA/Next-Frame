var express = require("express");
var router = express.Router();

var riscoController = require("../controllers/riscoController");

router.post("/atualizar", riscoController.atualizarRisco);

module.exports = router;
