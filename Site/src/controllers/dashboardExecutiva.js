let dashboardModel = require("../models/dashboardModel");

let TAXA_SEGURA_PADRAO = { Conservador: 70, Moderado: 55, Arrojado: 40 };
let MARGEM_MEDIO = 15;

function classificarRisco(percentual, taxaSegura) {
    if (percentual >= taxaSegura) return "BAIXO";
    if (percentual >= taxaSegura - MARGEM_MEDIO) return "MÉDIO";
    return "ALTO";
}

function kpiRisco(req, res) {
    let idEmpresa = Number(req.query.idEmpresa);
    let genero = req.query.genero;
    let orcamento = Number(req.query.orcamento);

    if (!idEmpresa || !genero || !orcamento) {
        return res.status(400).json({ erro: "Informe idEmpresa, genero e orcamento." });
    }

    dashboardModel.buscarPerfilEmpresa(idEmpresa)
        .then(function (empresas) {
            if (empresas.length === 0) {
                return res.status(404).json({ erro: "Empresa não encontrada." });
            }

            let perfil = empresas[0].perfil_risco;
            let taxaSegura = empresas[0].taxa_sucesso_segura !== null
                ? Number(empresas[0].taxa_sucesso_segura)
                : TAXA_SEGURA_PADRAO[perfil];

            if (taxaSegura === undefined) {
                return res.status(400).json({ erro: "Empresa sem perfil de risco definido." });
            }

            return dashboardModel.contarFilmesRecorte(genero, orcamento)
                .then(function (resultado) {
                    let total = Number(resultado[0].total);
                    let positivos = Number(resultado[0].positivos);
                    let percentual = total ? (positivos / total) * 100 : 0;

                    res.json({
                        nivel: total ? classificarRisco(percentual, taxaSegura) : "SEM DADOS",
                        percentual: Math.round(percentual),
                        positivos: positivos,
                        total: total,
                        perfil: perfil,
                        taxaSegura: taxaSegura
                    });
                });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao calcular o risco histórico." });
        });
}

module.exports = { kpiRisco };