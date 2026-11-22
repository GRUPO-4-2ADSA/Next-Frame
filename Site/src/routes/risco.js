var express = require("express");
var router = express.Router();

var riscoController = require("../controllers/riscoController");

router.post("/atualizar", riscoController.atualizarRisco);

router.get("/consultar/:idEmpresa", riscoController.consultarRisco);

module.exports = router;
