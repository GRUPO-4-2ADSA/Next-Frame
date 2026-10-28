var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

// Cadastrar usuário
router.post("/cadastrar", usuarioController.cadastrar);

// Autenticar usuário
router.post("/autenticar", usuarioController.autenticar);

// Listar todos os usuários
router.get("/listar/:idEmpresa", usuarioController.listar);

// Listar empresas (precisa ficar antes de /:id)
router.get("/empresas", usuarioController.listarEmpresas);

// Consultar histórico de ações do usuário
router.get("/:id/historico", usuarioController.buscarHistorico);

// Buscar usuário por ID
router.get("/:id", usuarioController.buscarPorId);

// Editar usuário
router.put("/:id", usuarioController.editar);

// Excluir usuário definitivamente
router.delete("/:id", usuarioController.excluir);

module.exports = router;
