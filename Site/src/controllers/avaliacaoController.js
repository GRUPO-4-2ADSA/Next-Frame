var avaliacaoModel = require("../models/avaliacaoModel");

function salvarDash(req, res) {
    var orcamento = req.body.orcamentoServer;
    var receita = req.body.receitaServer;
    var genero = req.body.generoServer;
    var idUsuario = req.body.idUsuarioServer;

    if (orcamento == undefined) {
        res.status(400).send("Preencha o campo de orcamento!");
    } else if (receita == undefined) {
        res.status(400).send("Preencha o campo de receita esperada!");
    } else if (genero == undefined) {
        res.status(400).send("Preencha o campo de gênero");
    } else {

        avaliacaoModel.salvarDash(idUsuario, orcamento, receita, genero)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao salvar os dados da DashBoard! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function buscarHistorico(req, res) {
    let idUsuario = req.body.idUsuarioServer;

    avaliacaoModel.buscarHistorico(idUsuario)
        .then(
            function (resultado) {
                if (resultado.length < 1) {
                    res.status(403).send("Você ainda não possui nenhum histórico");
                } else {
                    res.status(200).json(resultado);
                }
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao buscar o histórico! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function excluirAvaliacao(req, res) {
    let idAvaliacao = req.body.idAvaliacaoServer;

    if (idAvaliacao == undefined) {
        res.status(400).send("O id da avaliação está indefinido!");
    } else {

        avaliacaoModel.excluirAvaliacao(idAvaliacao)
            .then(
                function (resultado) {
                    res.status(200).json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao excluir a avaliação! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function editarAvaliacao(req, res) {
    var idAvaliacao = req.body.idAvaliacaoServer;
    var orcamento = req.body.orcamentoServer;
    var receita = req.body.receitaServer;
    var genero = req.body.generoServer;

    if (idAvaliacao == undefined) {
        res.status(400).send("O id da avaliação está indefinido!");
    } else if (orcamento == undefined) {
        res.status(400).send("Preencha o campo de orçamento!");
    } else if (receita == undefined) {
        res.status(400).send("Preencha o campo de receita esperada!");
    } else if (genero == undefined) {
        res.status(400).send("Preencha o campo de gênero");
    } else {
        avaliacaoModel.editarAvaliacao(idAvaliacao, orcamento, receita, genero)
            .then(function (resultado) {
                res.status(200).json(resultado);
            }).catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao editar a avaliação! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    salvarDash,
    buscarHistorico,
    excluirAvaliacao,
    editarAvaliacao
};