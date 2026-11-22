let dashboardExecutivaModel = require("../models/dashboardExecutivaModel");

let FAIXAS_RISCO = {
    Conservador: { baixo: 70, medio: 55 },
    Moderado: { baixo: 55, medio: 40 },
    Arrojado: { baixo: 40, medio: 25 }
};

function classificarRisco(percentual, faixas) {
    if (percentual >= faixas.baixo) return "BAIXO";
    if (percentual >= faixas.medio) return "MÉDIO";
    return "ALTO";
}

function kpiRisco(req, res) {
    let idUsuario = Number(req.query.idUsuario);
    let genero = req.query.genero;
    let orcamento = Number(req.query.orcamento);

    if (!idUsuario || !genero || !orcamento) {
        return res.status(400).json({ erro: "Informe idUsuario, genero e orcamento." });
    }

    dashboardExecutivaModel.buscarPerfilPorUsuario(idUsuario)
        .then(function (empresas) {
            if (empresas.length === 0) {
                return res.status(404).json({ erro: "Empresa não encontrada." });
            }

            let perfil = empresas[0].perfil_risco;
            let faixas = FAIXAS_RISCO[perfil];

            if (!faixas) {
                return res.status(400).json({ erro: "Empresa sem perfil de risco válido." });
            }

            return dashboardExecutivaModel.contarFilmesRecorte(genero, orcamento)
                .then(function (resultado) {
                    let total = Number(resultado[0].total);
                    let positivos = Number(resultado[0].positivos);
                    let percentual = total ? (positivos / total) * 100 : 0;

                    res.json({
                        nivel: total ? classificarRisco(percentual, faixas) : "SEM DADOS",
                        percentual: Math.round(percentual),
                        positivos: positivos,
                        total: total,
                        perfil: perfil,
                        faixas: faixas
                    });
                });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao calcular o risco histórico." });
        });
}

module.exports = {
    kpiRisco
};