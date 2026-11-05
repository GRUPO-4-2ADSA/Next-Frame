var riscoModel = require("../models/riscoModel");

function atualizarRisco(req, res) {

    var idEmpresa = req.body.idEmpresaServer;
    var risco = req.body.riscoServer;

    if (idEmpresa == null || idEmpresa == "" ||
        risco == null || risco == "") {

        res.status(400).send("Os campos não podem ser nulos ou vazios!");

    } else if (
        risco != "Conservador" &&
        risco != "Moderado" &&
        risco != "Arrojado"
    ) {

        res.status(400).send("Perfil de risco inválido!");

    } else {

        riscoModel.atualizarRisco(idEmpresa, risco)
            .then(function (resultado) {
                res.status(200).json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro);
            });
    }
}

function consultarRisco(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);

    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({
            mensagem: "Empresa inválida."
        });
    }

    riscoModel.consultarRisco(idEmpresa)
        .then(function (resultado) {
            if (resultado.length == 0) {
                return res.status(404).json({
                    mensagem: "Empresa não encontrada."
                });
            }

            res.status(200).json(resultado[0]);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({
                mensagem: "Erro ao consultar o perfil de risco."
            });
        });
}

module.exports = {
    atualizarRisco,
    consultarRisco
};