
var database = require("../database/config");

function buscarAvaliacao(idAvaliacao, idUsuario) {

    var instrucaoSql = `
        SELECT
            orcamento,
            receita,
            genero
        FROM historicoAvaliacao
        WHERE id_historico = ?
        AND id_usuario = ?;
    `;

    return database.executar(instrucaoSql, [idAvaliacao, idUsuario]);
}

function buscarFilmesComparativos(orcamentoMinimo, orcamentoMaximo) {

    var instrucaoSql = `
        SELECT
            f.id_filme,
            f.titulo,
            f.generos,
            f.orcamento,
            f.receita,
            YEAR(f.data_lanc) AS anoLancamento,
            COALESCE(
                f.roi,
                (f.receita - f.orcamento) /
                NULLIF(f.orcamento, 0) * 100
            ) AS roi
        FROM filme f
        WHERE f.orcamento BETWEEN ? AND ?
        ORDER BY f.data_lanc ASC;
    `;

    return database.executar(instrucaoSql, [orcamentoMinimo, orcamentoMaximo]);
}

module.exports = {
    buscarAvaliacao,
    buscarFilmesComparativos
};
