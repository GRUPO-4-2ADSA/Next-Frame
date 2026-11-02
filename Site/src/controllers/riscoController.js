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

module.exports = {
    atualizarRisco
};