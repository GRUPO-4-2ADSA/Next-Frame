
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

function buscarTop5Generos() {
    var instrucaoSql = `
        SELECT
            g.nome AS genero,
            AVG(i.valor) AS interesseMedio
        FROM poc_trends.interesse i
        JOIN poc_trends.genero g
            ON i.fk_genero = g.id
        WHERE i.geo = 'WW'
        AND i.data_ref >= DATE_SUB(
            (
                SELECT MAX(data_ref)
                FROM poc_trends.interesse
                WHERE geo = 'WW'
            ),
            INTERVAL 11 MONTH
        )
        GROUP BY g.id, g.nome
        ORDER BY interesseMedio DESC
        LIMIT 5;
    `;

    return database.executar(instrucaoSql);
}

function buscarHistoricoGenero(genero) {
    var instrucaoSql = `
        SELECT
            i.data_ref AS data,
            i.valor AS interesse
        FROM poc_trends.interesse i
        JOIN poc_trends.genero g
            ON i.fk_genero = g.id
        WHERE g.nome = '${genero}'
        AND i.geo = 'WW'
        AND i.data_ref >= DATE_SUB(
            (
                SELECT MAX(data_ref)
                FROM poc_trends.interesse
                WHERE geo = 'WW'
            ),
            INTERVAL 5 YEAR
        )
        ORDER BY i.data_ref ASC;
    `;

    return database.executar(instrucaoSql);
}

function buscarUltimaDataInteresse() {
    var instrucaoSql = `
        SELECT MAX(data_ref, '%Y-%m-%d') AS ultimaData
        FROM poc_trends.interesse
        WHERE geo = 'WW';
    `;

    return database.executar(instrucaoSql);
}

function buscarPosicaoGenero(genero, dataReferencia) {
    var instrucaoSql = `
        SELECT
            g.nome AS genero,
            i.valor AS interesse,
            (
                SELECT COUNT(*)
                FROM poc_trends.interesse i2
                JOIN poc_trends.genero g2
                    ON i2.fk_genero = g2.id
                WHERE i2.data_ref = i.data_ref
                AND i2.geo = 'WW'
                AND i2.valor > i.valor
            ) + 1 AS posicao
        FROM poc_trends.interesse i
        JOIN poc_trends.genero g
            ON i.fk_genero = g.id
        WHERE g.nome = '${genero}'
        AND i.data_ref = '${dataReferencia}'
        AND i.geo = 'WW';
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    buscarAvaliacao,
    buscarFilmesComparativos,
    buscarTop5Generos,
    buscarHistoricoGenero, 
    buscarUltimaDataInteresse,
    buscarPosicaoGenero
};
