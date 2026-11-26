
var database = require("../database/config");

function buscarPerfilRisco(idUsuario) {
    var instrucaoSql = `
        SELECT
            e.perfil_risco
        FROM Usuario u
        INNER JOIN Empresa e
            ON u.id_empresa = e.id_empresa
        WHERE u.id_usuario = ${idUsuario}
        LIMIT 1;
    `;

    return database.executar(instrucaoSql);
}

function buscarFilmesPorOrcamento(orcamento, genero) {

    var instrucaoSql = `
        SELECT
            cenarios.nome,
            cenarios.orcamento,

            COUNT(f.id_filme) AS quantidadeFilmes,

            SUM(CASE
                WHEN f.id_filme IS NOT NULL AND f.receita > f.orcamento THEN 1
                ELSE 0
            END) AS quantidadeSuperavit,

            SUM(CASE
                WHEN f.id_filme IS NOT NULL AND f.receita < f.orcamento THEN 1
                ELSE 0
            END) AS quantidadeDeficit,

            SUM(CASE
                WHEN f.id_filme IS NOT NULL AND f.receita = f.orcamento THEN 1
                ELSE 0
            END) AS quantidadeNeutro

        FROM (
            SELECT 'menos40' AS nome, ${orcamento * 0.6} AS orcamento
            UNION ALL
            SELECT 'menos20', ${orcamento * 0.8}
            UNION ALL
            SELECT 'padrao', ${orcamento}
            UNION ALL
            SELECT 'mais20', ${orcamento * 1.2}
            UNION ALL
            SELECT 'mais40', ${orcamento * 1.4}
        ) AS cenarios

        LEFT JOIN filme f
            ON f.orcamento BETWEEN
                cenarios.orcamento * 0.9
                AND cenarios.orcamento * 1.1
            AND f.genero = '${genero}'
            AND f.orcamento IS NOT NULL
            AND f.receita IS NOT NULL

        GROUP BY cenarios.nome, cenarios.orcamento

        ORDER BY FIELD(
            cenarios.nome,
            'menos40',
            'menos20',
            'padrao',
            'mais20',
            'mais40'
        );
    `;

    return database.executar(instrucaoSql);
}

function buscarFilmesSemelhantesMelhorCenario(orcamento, genero) {
    var instrucaoSql = `
        SELECT
            f.id_filme,
            f.orcamento,
            f.receita
        FROM filme f
        WHERE f.genero = '${genero}'
            AND f.orcamento BETWEEN
                ${orcamento * 0.8}
                AND ${orcamento * 1.2}
            AND f.orcamento > 0
            AND f.receita IS NOT NULL
            AND f.receita >= 0;
    `;

    return database.executar(instrucaoSql);
}

function buscarFilmesPorGenero(genero) {
    var instrucaoSql = `
        SELECT
            f.orcamento,
            f.receita
        FROM filme f
        WHERE f.genero = '${genero}'
            AND f.orcamento IS NOT NULL
            AND f.orcamento > 0
            AND f.receita IS NOT NULL
            AND f.receita >= 0;
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    buscarPerfilRisco,
    buscarFilmesPorOrcamento,
    buscarFilmesSemelhantesMelhorCenario,
    buscarFilmesPorGenero
};
