
var dashboardComparativaModel = require("../models/dashboardComparativaModel");

// Calcula a data do mês anterior
function buscarMesAnterior(data) {
    var partes = String(data).substring(0, 10).split("-");

    var ano = Number(partes[0]);
    var mes = Number(partes[1]);

    if (mes == 1) {
        ano--;
        mes = 12;
    } else {
        mes--;
    }

    return ano + "-" + String(mes).padStart(2, "0") + "-01";
}

function buscarDadosInteresse(req, res) {

    var idAvaliacao = Number(req.params.idAvaliacao);
    var idUsuario = Number(req.params.idUsuario);

    if (!Number.isSafeInteger(idAvaliacao) || idAvaliacao <= 0 ||
        !Number.isSafeInteger(idUsuario) || idUsuario <= 0) {

        return res.status(400).json({
            mensagem: "Identificação da avaliação inválida."
        });
    }

    // Busca o gênero selecionado na avaliação
    dashboardComparativaModel.buscarAvaliacao(idAvaliacao, idUsuario)
        .then(function (avaliacoes) {

            if (avaliacoes.length == 0) {
                return res.status(404).json({
                    mensagem: "Avaliação não encontrada."
                });
            }

            var generoSelecionado = avaliacoes[0].genero.trim();

            // Busca os dados do Google Trends
            return Promise.all([
                dashboardComparativaModel.buscarTop5Generos(),
                dashboardComparativaModel.buscarHistoricoGenero(generoSelecionado),
                dashboardComparativaModel.buscarUltimaDataInteresse()
            ]).then(function (dadosTrends) {

                var top5Generos = dadosTrends[0];
                var historicoGenero = dadosTrends[1];
                var ultimaData = dadosTrends[2][0].ultimaData;

                // Verifica se existem dados coletados
                if (ultimaData == null) {
                    return res.status(200).json({
                        top5: [],
                        historico: [],
                        kpi: null
                    });
                }

                var dataReferencia = String(ultimaData).substring(0, 10);
                var dataAnterior = buscarMesAnterior(dataReferencia);

                // Busca a posição do gênero no mês atual e no anterior
                return Promise.all([
                    dashboardComparativaModel.buscarPosicaoGenero(
                        generoSelecionado,
                        dataReferencia
                    ),
                    dashboardComparativaModel.buscarPosicaoGenero(
                        generoSelecionado,
                        dataAnterior
                    )
                ]).then(function (posicoes) {

                    var posicaoAtual = posicoes[0].length > 0
                        ? Number(posicoes[0][0].posicao) : null;

                    var posicaoAnterior = posicoes[1].length > 0
                        ? Number(posicoes[1][0].posicao) : null;

                    var diferenca = null;
                    var movimento = null;

                    if (posicaoAtual != null && posicaoAnterior != null) {

                        diferenca = posicaoAnterior - posicaoAtual;

                        if (diferenca > 0) {
                            movimento = "subiu";
                        } else if (diferenca < 0) {
                            movimento = "caiu";
                        } else {
                            movimento = "manteve";
                        }
                    }

                    res.status(200).json({
                        top5: top5Generos,
                        historico: historicoGenero,
                        kpi: {
                            genero: generoSelecionado,
                            posicaoAtual: posicaoAtual,
                            posicaoAnterior: posicaoAnterior,
                            diferenca: diferenca,
                            movimento: movimento
                        }
                    });
                });
            });
        })
        .catch(function (erro) {

            console.log("Erro na Dashboard de Interesse:", erro);

            res.status(500).json({
                mensagem: "Erro ao buscar dados de interesse público."
            });
        });
}

module.exports = {
    buscarDadosInteresse
};
