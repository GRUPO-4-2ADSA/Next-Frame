
var dashboardComparativaModel = require("../models/dashboardComparativaModel");

// Margem provisória de 20% para encontrar orçamentos semelhantes
var margemOrcamento = 0.20;

function calcularMediana(valores) {

    // Ordena os ROIs do menor para o maior
    valores.sort(function (a, b) {
        return a - b;
    });

    // Encontra a posição central do array
    var meio = Math.floor(valores.length / 2);

    // Se for par, calcula a média dos dois valores centrais
    if (valores.length % 2 == 0) {
        return (valores[meio - 1] + valores[meio]) / 2;
    }

    // Se for ímpar, retorna o valor central
    return valores[meio];
}

function buscarDadosComparativa(req, res) {

    var idAvaliacao = Number(req.params.idAvaliacao);
    var idUsuario = Number(req.params.idUsuario);

    if (!Number.isSafeInteger(idAvaliacao) || idAvaliacao <= 0 ||
        !Number.isSafeInteger(idUsuario) || idUsuario <= 0) {

        return res.status(400).json({
            mensagem: "Identificação da avaliação inválida."
        });
    }

    dashboardComparativaModel.buscarAvaliacao(idAvaliacao, idUsuario)
        .then(function (avaliacoes) {

            if (avaliacoes.length == 0) {
                return res.status(404).json({
                    mensagem: "Avaliação não encontrada."
                });
            }

            var avaliacao = avaliacoes[0];
            var orcamento = Number(avaliacao.orcamento);
            var generoSelecionado = avaliacao.genero.trim();

            if (!Number.isFinite(orcamento) || orcamento <= 0) {
                return res.status(400).json({
                    mensagem: "Orçamento da avaliação inválido."
                });
            }

            // Define a faixa de orçamento que será pesquisada
            var orcamentoMinimo = orcamento * (1 - margemOrcamento);
            var orcamentoMaximo = orcamento * (1 + margemOrcamento);

            return dashboardComparativaModel.buscarFilmesComparativos(
                orcamentoMinimo,
                orcamentoMaximo
            ).then(function (filmes) {

                var generos = {};
                var anoInicio = null;
                var anoFim = null;

                filmes.forEach(function (filme) {

                    // Identifica o menor e o maior ano entre os filmes encontrados
                    if (filme.anoLancamento != null) {
                        var ano = Number(filme.anoLancamento);

                        if (anoInicio === null || ano < anoInicio) {
                            anoInicio = ano;
                        }

                        if (anoFim === null || ano > anoFim) {
                            anoFim = ano;
                        }
                    }

                    // Desconsidera filmes sem ROI ou gênero
                    if (filme.roi == null || !filme.generos) return;

                    var roi = Number(filme.roi);
                    if (!Number.isFinite(roi)) return;

                    // Separa os gêneros para o filme participar de cada um
                    var listaGeneros = filme.generos.split(",");
                    var generosDoFilme = new Set();

                    listaGeneros.forEach(function (genero) {
                        genero = genero.trim();

                        var chave = genero.toLowerCase();

                        // Evita gêneros vazios ou repetidos no mesmo filme
                        if (genero == "" || generosDoFilme.has(chave)) {
                            return;
                        }

                        generosDoFilme.add(chave);

                        // Agrupa os ROIs dos filmes por gênero
                        if (!generos[chave]) {
                            generos[chave] = {
                                nome: genero,
                                valores: []
                            };
                        }

                        generos[chave].valores.push(roi);
                    });
                });

                // Transforma os grupos de gêneros em um ranking com medianas
                var ranking = Object.keys(generos).map(function (chave) {

                    var grupo = generos[chave];
                    var mediana = calcularMediana(grupo.valores);

                    return {
                        genero: grupo.nome,
                        roiMediano: Number(mediana.toFixed(2))
                    };
                });

                // Ordena do maior ROI mediano para o menor
                // Em caso de empate, organiza por ordem alfabética
                ranking.sort(function (a, b) {
                    return b.roiMediano - a.roiMediano ||
                        a.genero.localeCompare(b.genero);
                });

                // Procura a posição do gênero escolhido pelo usuário
                var indice = ranking.findIndex(function (item) {
                    return item.genero.toLowerCase() ==
                        generoSelecionado.toLowerCase();
                });

                // Retorna os 10 primeiros gêneros e os dados da KPI
                res.status(200).json({
                    periodo: {
                        anoInicio: anoInicio,
                        anoFim: anoFim
                    },
                    totalFilmes: filmes.length,
                    top10: ranking.slice(0, 10),
                    kpi: {
                        genero: generoSelecionado,

                        // Posição só é exibida se estiver no Top 10
                        posicao: indice >= 0 && indice < 10
                            ? indice + 1 : null,

                        roiMediano: indice >= 0
                            ? ranking[indice].roiMediano : null,

                        lider: ranking[0] || null
                    }
                });
            });
        })
        .catch(function (erro) {
            console.log("Erro na Dashboard Comparativa:", erro);

            res.status(500).json({
                mensagem: "Erro ao buscar dados da Dashboard Comparativa."
            });
        });
}

module.exports = {
    buscarDadosComparativa
};
