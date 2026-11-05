var analiseHistoricaModel = require("../models/analiseHistoricaModel");

let generosPermitidos = [
    "Action", "Animation", "Adventure", "Comedy",
    "Crime", "Documentary", "Drama", "Family",
    "Fantasy", "Science Fiction", "War",
    "Music", "Romance", "Superhero",
    "Thriller", "Horror"
];
function converterNumero(valor) {
    // Somente inteiros não negativos, escritos apenas com algarismos.
    if (typeof valor !== "string" || !/^\d+$/.test(valor)) return NaN;

    var numero = Number(valor);
    return Number.isSafeInteger(numero) ? numero : NaN;
}

function validarFiltros(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Formato de filtros inválido.");
    }

    var filtros = {};
    var campos = ["dataLancamento", "receita", "orcamento", "genero"];
    var operadores = ["maior", "igual", "menor"];

    for (var campo of campos) {
        var filtro = dados[campo];

        if (filtro === undefined || filtro === null) continue;
        if (typeof filtro !== "object" || Array.isArray(filtro)) {
            throw new Error("Filtro inválido: " + campo);
        }
        if (filtro.valor === undefined || filtro.valor === null ||
            String(filtro.valor).trim() === "") continue;

        if (campo === "genero") {
            if (typeof filtro.valor !== "string" ||
                !generosPermitidos.includes(filtro.valor)) {
                throw new Error("Informe um gênero válido.");
            }

            filtros.genero = { valor: filtro.valor };
            continue;
        }

        var operador = filtro.operador || "igual";
        if (!operadores.includes(operador)) {
            throw new Error("Operador inválido em: " + campo);
        }

        if (campo === "dataLancamento") {
            var data = filtro.valor;

            if (typeof data !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
                Number.isNaN(new Date(data + "T00:00:00Z").getTime()) ||
                new Date(data + "T00:00:00Z").toISOString().slice(0, 10) !== data) {
                throw new Error("Data de lançamento inválida.");
            }

            filtros[campo] = { valor: data, operador: operador };
        } else {
            var numero = converterNumero(filtro.valor);

            if (!Number.isFinite(numero) || numero < 0) {
                throw new Error("Valor inválido em: " + campo + ". Use apenas algarismos.");
            }

            filtros[campo] = { valor: numero, operador: operador };
        }
    }

    return filtros;
}

function pesquisar(req, res) {
    var filtros;

    try {
        filtros = validarFiltros(req.body || {});
    } catch (erro) {
        return res.status(400).json({ mensagem: erro.message });
    }

    analiseHistoricaModel.pesquisar(filtros)
        .then(function (filmes) {
            res.status(200).json(filmes);
        })
        .catch(function (erro) {
            console.error("Erro na análise histórica:", erro);
            res.status(500).json({
                mensagem: "Erro ao buscar filmes no banco de dados."
            });
        });
}

function listar(req, res) {
    req.body = {};
    pesquisar(req, res);
}

module.exports = {
    pesquisar,
    listar
};
