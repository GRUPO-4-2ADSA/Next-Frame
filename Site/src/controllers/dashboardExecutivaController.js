let dashboardExecutivaModel = require("../models/dashboardExecutivaModel");
let estatistica = require("../utils/estatistica");

let FAIXAS_RISCO = {
    Conservador: { baixo: 80, medio: 60 },
    Moderado: { baixo: 65, medio: 45 },
    Arrojado: { baixo: 50, medio: 30 }
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
                        nivel: total ? classificarRisco(Math.round(percentual), faixas) : "SEM DADOS",
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

function kpiRoiMediano(req, res) {
    let genero = req.query.genero;
    let orcamento = Number(req.query.orcamento);

    if (!genero || !orcamento) {
        return res.status(400).json({ erro: "Informe genero e orcamento." });
    }

    dashboardExecutivaModel.listarRetornosDoGenero(genero)
        .then(function (filmes) {
            let retornosGenero = filmes.map(function (f) { return Number(f.retorno); });
            let retornosRecorte = filmes
                .filter(function (f) { return Number(f.orcamento) <= orcamento; })
                .map(function (f) { return Number(f.retorno); });

            if (retornosRecorte.length === 0) {
                return res.json({
                    semDados: true,
                    totalRecorte: 0,
                    totalGenero: retornosGenero.length
                });
            }

            let medianaRecorte = estatistica.mediana(retornosRecorte);
            let medianaGenero = estatistica.mediana(retornosGenero);
            let diferencaPct = ((medianaRecorte - medianaGenero) / medianaGenero) * 100;

            res.json({
                semDados: false,
                totalRecorte: retornosRecorte.length,
                totalGenero: retornosGenero.length,
                // usados pela financeira (em "X")
                retornoMediano: Number(medianaRecorte.toFixed(2)),
                retornoMedianoGenero: Number(medianaGenero.toFixed(2)),
                diferencaRetorno: Number((medianaRecorte - medianaGenero).toFixed(2)),
                // usados pela executiva (em %)
                roiMedianoPct: Math.round((medianaRecorte - 1) * 100),
                roiMedianoGeneroPct: Math.round((medianaGenero - 1) * 100),
                diferencaPct: Math.round(Math.abs(diferencaPct)),
                posicao: diferencaPct >= 0 ? "ACIMA" : "ABAIXO"
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao calcular o ROI mediano." });
        });
}

function classificarCorrelacao(r) {
    if (r === null) return "SEM DADOS";
    let forca = Math.abs(r);
    if (forca >= 0.7) return "FORTE";
    if (forca >= 0.4) return "MODERADA";
    return "FRACA";
}

function graficoDispersao(req, res) {
    res.set("Cache-Control", "no-store");

    let genero = req.query.genero;
    let orcamento = Number(req.query.orcamento);
    let receita = Number(req.query.receita) || null;

    if (!genero || !orcamento) {
        return res.status(400).json({ erro: "Informe genero e orcamento." });
    }

    dashboardExecutivaModel.listarFilmesDoRecorte(genero, orcamento)
        .then(function (resultado) {
            let filmes = resultado.map(function (f) {
                return {
                    titulo: f.titulo,
                    orcamento: Number(f.orcamento),
                    receita: Number(f.receita)
                };
            });

            if (filmes.length === 0) {
                return res.json({ semDados: true, total: 0 });
            }

            let x = filmes.map(function (f) { return f.orcamento; });
            let y = filmes.map(function (f) { return f.receita; });
            let retornos = filmes.map(function (f) { return f.receita / f.orcamento; });

            let limites = estatistica.limitesIQR(retornos);
            let r = estatistica.correlacao(x, y);
            let reta = estatistica.regressao(x, y);

            let pontos = filmes.map(function (f, i) {
                return {
                    titulo: f.titulo,
                    orcamento: f.orcamento,
                    receita: f.receita,
                    outlier: retornos[i] < limites.min || retornos[i] > limites.max
                };
            });

            let tendencia = null;
            if (reta) {
                let menorX = Math.min(...x);
                let maiorX = Math.max(...x);
                tendencia = {
                    inicio: { x: menorX, y: Math.round(reta.a * menorX + reta.b) },
                    fim: { x: maiorX, y: Math.round(reta.a * maiorX + reta.b) }
                };
            }

            res.json({
                semDados: false,
                total: filmes.length,
                correlacao: r === null ? null : Number(r.toFixed(2)),
                forca: classificarCorrelacao(r),
                pontos: pontos,
                totalOutliers: pontos.filter(function (p) { return p.outlier; }).length,
                limitesRoi: {
                    min: Number(limites.min.toFixed(2)),
                    max: Number(limites.max.toFixed(2))
                },
                tendencia: tendencia,
                seuProjeto: { orcamento: orcamento, receita: receita }
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao montar o gráfico de dispersão." });
        });
}

module.exports = {
    kpiRisco,
    kpiRoiMediano,
    graficoDispersao
};