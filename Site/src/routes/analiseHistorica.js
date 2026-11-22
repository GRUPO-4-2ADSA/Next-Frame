var express = require("express");
var router = express.Router();
var analiseHistoricaController = require("../controllers/analiseHistoricaController");

router.get("/filmes", analiseHistoricaController.listar);
router.post("/pesquisar", analiseHistoricaController.pesquisar);

module.exports = router;