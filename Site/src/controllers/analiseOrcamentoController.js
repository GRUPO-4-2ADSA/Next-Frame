var analiseOrcamentoModel = require("../models/analiseOrcamentoModel");

// Define a taxa mínima de risco médio conforme o perfil
function buscarTaxaMinima(perfilRisco) {

    var limitesRisco = {
        Conservador: 60,
        Moderado: 45,
        Arrojado: 30
    };

    return limitesRisco[perfilRisco];
}

// Busca e valida o perfil de risco da empresa
function buscarPerfilRisco(idUsuario) {

    return analiseOrcamentoModel.buscarPerfilRisco(idUsuario)
        .then(function (resultado) {

            if (!resultado[0] || !resultado[0].perfil_risco) {
                return {
                    perfilRisco: null,
                    taxaMinimaRiscoMedio: null
                };
            }

            var perfilRisco = resultado[0].perfil_risco;
            var taxaMinimaRiscoMedio = buscarTaxaMinima(perfilRisco);

            if (taxaMinimaRiscoMedio === undefined) {
                throw {
                    status: 400,
                    mensagem: "Perfil de risco inválido."
                };
            }

            return {
                perfilRisco: perfilRisco,
                taxaMinimaRiscoMedio: taxaMinimaRiscoMedio
            };
        });
}

// Calcula as porcentagens de um cenário
function calcularPorcentagens(filme) {

    var quantidadeFilmes = Number(filme.quantidadeFilmes) || 0;
    var quantidadeSuperavit = Number(filme.quantidadeSuperavit) || 0;
    var quantidadeDeficit = Number(filme.quantidadeDeficit) || 0;
    var quantidadeNeutro = Number(filme.quantidadeNeutro) || 0;

    var porcentagemSuperavit = 0;
    var porcentagemDeficit = 0;
    var porcentagemNeutro = 0;

    if (quantidadeFilmes > 0) {

        porcentagemSuperavit = Number(
            ((quantidadeSuperavit / quantidadeFilmes) * 100).toFixed(2)
        );

        porcentagemDeficit = Number(
            ((quantidadeDeficit / quantidadeFilmes) * 100).toFixed(2)
        );

        porcentagemNeutro = Number(
            ((quantidadeNeutro / quantidadeFilmes) * 100).toFixed(2)
        );
    }

    return {
        orcamento: Number(filme.orcamento),
        porcentagemSuperavit: porcentagemSuperavit,
        porcentagemDeficit: porcentagemDeficit,
        porcentagemNeutro: porcentagemNeutro,
        quantidadeFilmes: quantidadeFilmes
    };
}

// Organiza os resultados dos cinco cenários
function montarAnalise(resultadoFilmes, dadosPerfil) {

    var analise = {
        perfilRisco: dadosPerfil.perfilRisco,
        taxaMinimaRiscoMedio: dadosPerfil.taxaMinimaRiscoMedio
    };

    for (var i = 0; i < resultadoFilmes.length; i++) {

        var filme = resultadoFilmes[i];

        analise[filme.nome] = calcularPorcentagens(filme);
    }

    return analise;
}

// Calcula o retorno por dólar e desconsidera registros inválidos
function obterRetornosValidos(resultadoFilmes) {

    var retornosValidos = [];

    for (var i = 0; i < resultadoFilmes.length; i++) {

        var filme = resultadoFilmes[i];

        if (
            filme.orcamento != null &&
            filme.receita != null &&
            filme.orcamento !== "" &&
            filme.receita !== ""
        ) {

            var orcamento = Number(filme.orcamento);
            var receita = Number(filme.receita);

            if (
                Number.isFinite(orcamento) &&
                Number.isFinite(receita) &&
                orcamento > 0 &&
                receita >= 0
            ) {

                var retornoPorDolar = receita / orcamento;

                if (Number.isFinite(retornoPorDolar)) {
                    retornosValidos.push(retornoPorDolar);
                }
            }
        }
    }

    return retornosValidos;
}

// Calcula a mediana dos retornos de todos os filmes do gênero
function calcularMedianaGeral(filmesGenero) {

    var retornos = obterRetornosValidos(filmesGenero);

    if (retornos.length === 0) {
        return null;
    }

    retornos.sort(function (a, b) {
        return a - b;
    });

    var meio = Math.floor(retornos.length / 2);

    var mediana;

    if (retornos.length % 2 === 0) {

        mediana = (
            retornos[meio - 1] +
            retornos[meio]
        ) / 2;

    } else {

        mediana = retornos[meio];
    }

    if (!Number.isFinite(mediana)) {
        return null;
    }

    return mediana;
}

// Calcula a média dos 10% melhores filmes semelhantes
function calcularMediaMelhoresSemelhantes(filmesSemelhantes) {

    var retornos = obterRetornosValidos(filmesSemelhantes);

    if (retornos.length === 0) {
        return null;
    }

    // Ordena do maior retorno para o menor
    retornos.sort(function (a, b) {
        return b - a;
    });

    // Seleciona os 10% melhores, arredondando para cima
    var quantidadeSelecionada = Math.max(
        1,
        Math.ceil(retornos.length * 0.10)
    );

    var somaRetornos = 0;

    for (var i = 0; i < quantidadeSelecionada; i++) {
        somaRetornos += retornos[i];
    }

    var retornoMedio = somaRetornos / quantidadeSelecionada;

    if (!Number.isFinite(retornoMedio)) {
        return null;
    }

    return {
        retornoMedio: retornoMedio,
        quantidadeFilmesValidos: retornos.length,
        quantidadeSelecionada: quantidadeSelecionada
    };
}

function calcularMediaPioresSemelhantes(filmesSemelhantes) {

    var retornos = obterRetornosValidos(filmesSemelhantes);

    if (retornos.length === 0) {
        return null;
    }

    // Ordena do menor retorno para o maior
    retornos.sort(function (a, b) {
        return a - b;
    });

    // Seleciona os 10% piores, arredondando para cima
    var quantidadeSelecionada = Math.max(
        1,
        Math.ceil(retornos.length * 0.10)
    );

    var somaRetornos = 0;

    for (var i = 0; i < quantidadeSelecionada; i++) {
        somaRetornos += retornos[i];
    }

    var retornoMedio = somaRetornos / quantidadeSelecionada;

    if (!Number.isFinite(retornoMedio)) {
        return null;
    }

    return {
        retornoMedio: retornoMedio,
        quantidadeFilmesValidos: retornos.length,
        quantidadeSelecionada: quantidadeSelecionada
    };
}

// Formata um retorno por dólar
function formatarRetorno(valor) {

    return valor.toFixed(2).replace(".", ",") + "x";
}

// Calcula os dois indicadores e a comparação entre eles
function calcularRoiMelhorCenario(filmesSemelhantes, filmesGenero) {

    var resultadoMelhores = calcularMediaMelhoresSemelhantes(
        filmesSemelhantes
    );

    var medianaGeral = calcularMedianaGeral(filmesGenero);

    if (!resultadoMelhores) {
        return null;
    }

    var retornoMedio = resultadoMelhores.retornoMedio;

    var detalhe = "MEDIANA GERAL DO GÊNERO INDISPONÍVEL";
    var diferenca = null;
    var medianaFormatada = null;
    var medianaArredondada = null;

    if (medianaGeral !== null && medianaGeral > 0) {

        diferenca = retornoMedio - medianaGeral;

        if (diferenca > 0) {

            detalhe =
                formatarRetorno(diferenca) +
                " ACIMA DA MEDIANA GERAL DO GÊNERO (" +
                formatarRetorno(medianaGeral) + ")";

        } else if (diferenca < 0) {

            detalhe =
                formatarRetorno(Math.abs(diferenca)) +
                " ABAIXO DA MEDIANA GERAL DO GÊNERO (" +
                formatarRetorno(medianaGeral) + ")";

        } else {

            detalhe =
                "IGUAL À MEDIANA GERAL DO GÊNERO (" +
                formatarRetorno(medianaGeral) + ")";
        }

        medianaArredondada = Number(medianaGeral.toFixed(4));
        medianaFormatada = formatarRetorno(medianaGeral);
    }

    var diferencaFormatada = null;

    if (diferenca !== null) {
        diferencaFormatada = Number(diferenca.toFixed(4));
    }

    return {
        valor: formatarRetorno(retornoMedio),

        retornoMedio: Number(retornoMedio.toFixed(4)),

        medianaGeral: medianaArredondada,

        medianaFormatada: medianaFormatada,

        diferenca: diferencaFormatada,

        detalhe: detalhe,

        quantidadeFilmesValidos:
            resultadoMelhores.quantidadeFilmesValidos,

        quantidadeSelecionada:
            resultadoMelhores.quantidadeSelecionada
    };
}

// Calcula os indicadores e a comparação do pior cenário
function calcularRoiPiorCenario(filmesSemelhantes, filmesGenero) {

    var resultadoPiores = calcularMediaPioresSemelhantes(
        filmesSemelhantes
    );

    var medianaGeral = calcularMedianaGeral(filmesGenero);

    if (!resultadoPiores) {
        return null;
    }

    var retornoMedio = resultadoPiores.retornoMedio;

    var detalhe = "MEDIANA GERAL INDISPONÍVEL";
    var diferenca = null;
    var medianaFormatada = null;
    var medianaArredondada = null;

    if (medianaGeral !== null) {

        if (retornoMedio < medianaGeral) {

            diferenca = medianaGeral - retornoMedio;

            detalhe =
                formatarRetorno(diferenca) +
                " abaixo da mediana geral (" +
                formatarRetorno(medianaGeral) + ")";

        } else if (retornoMedio > medianaGeral) {

            diferenca = retornoMedio - medianaGeral;

            detalhe =
                formatarRetorno(diferenca) +
                " acima da mediana geral (" +
                formatarRetorno(medianaGeral) + ")";

        } else {

            diferenca = 0;

            detalhe =
                "IGUAL À MEDIANA GERAL (" +
                formatarRetorno(medianaGeral) + ")";
        }

        medianaArredondada = Number(medianaGeral.toFixed(4));
        medianaFormatada = formatarRetorno(medianaGeral);
    }

    var diferencaFormatada = null;

    if (diferenca !== null) {
        diferencaFormatada = Number(diferenca.toFixed(4));
    }

    return {
        valor: formatarRetorno(retornoMedio),

        retornoMedio: Number(retornoMedio.toFixed(4)),

        medianaGeral: medianaArredondada,

        medianaFormatada: medianaFormatada,

        diferenca: diferencaFormatada,

        detalhe: detalhe,

        quantidadeFilmesValidos:
            resultadoPiores.quantidadeFilmesValidos,

        quantidadeSelecionada:
            resultadoPiores.quantidadeSelecionada
    };
}

// Controller principal
function analisarOrcamento(req, res) {

    var orcamento = Number(req.body.orcamentoServer);
    var genero = req.body.generoServer;
    var idUsuario = Number(req.body.idUsuarioServer);

    if (
        req.body.orcamentoServer == null ||
        req.body.orcamentoServer === "" ||
        !Number.isFinite(orcamento) ||
        orcamento <= 0
    ) {
        return res.status(400).json({
            mensagem: "Orçamento inválido."
        });
    }

    if (typeof genero !== "string" || genero.trim() === "") {
        return res.status(400).json({
            mensagem: "Gênero inválido."
        });
    }

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            mensagem: "ID do usuário inválido."
        });
    }

    genero = genero.trim();

    // Primeiro busca o perfil de risco
    buscarPerfilRisco(idUsuario)

        .then(function (dadosPerfil) {

            // Busca os dados dos cinco cenários
            return analiseOrcamentoModel.buscarFilmesPorOrcamento(
                orcamento,
                genero
            ).then(function (resultadoFilmes) {

                var analise = montarAnalise(
                    resultadoFilmes,
                    dadosPerfil
                );

                // Busca filmes do mesmo gênero e orçamento semelhante
                return analiseOrcamentoModel.buscarFilmesSemelhantesMelhorCenario(
                    orcamento,
                    genero
                ).then(function (filmesSemelhantes) {

                    // Busca todos os filmes válidos do gênero,
                    // sem aplicar filtro de orçamento
                    return analiseOrcamentoModel.buscarFilmesPorGenero(
                        genero
                    ).then(function (filmesGenero) {

                        analise.roiMelhorCenario =
                            calcularRoiMelhorCenario(
                                filmesSemelhantes,
                                filmesGenero
                            );

                        analise.roiPiorCenario =
                            calcularRoiPiorCenario(
                                filmesSemelhantes,
                                filmesGenero
                            );

                        return analise;
                    });
                });
            });
        })

        .then(function (analise) {

            return res.status(200).json(analise);
        })

        .catch(function (erro) {

            console.log(erro);

            return res.status(erro.status || 500).json({
                mensagem: erro.mensagem ||
                    "Erro ao analisar os filmes por orçamento."
            });
        });
}

module.exports = {
    analisarOrcamento
};