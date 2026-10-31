var express = require("express");
var router = express.Router();
var avaliacaoController = require("../controllers/avaliacaoController");

router.post("/salvarDash", avaliacaoController.salvarDash);

router.post("/buscarHistorico", avaliacaoController.buscarHistorico);

router.post("/excluirAvaliacao", avaliacaoController.excluirAvaliacao);

router.post("/editarAvaliacao", avaliacaoController.editarAvaliacao);

module.exports = router;