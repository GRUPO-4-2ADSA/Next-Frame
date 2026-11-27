var database = require("../database/config");

// Retorna as receitas para KPI financeira de Receita mediana do recorte 

function buscarReceitasDoRecorte(genero, orcamento) {
    var instrucaoSql = `
        SELECT receita
        FROM filme
        WHERE LOWER(generos) LIKE ?
            AND orcamento > 0
            AND orcamento <= ?
            AND receita > 0
        ORDER BY receita ASC;
    `;

    var parametros = ["%" + genero.toLowerCase() + "%", orcamento];

    return database.executar(instrucaoSql, parametros);
}

function buscarDesempenhoFinanceiro(genero, orcamento) {
    var instrucaoSql = `
        SELECT
            SUM(CASE WHEN (receita - orcamento) / orcamento < -0.10 THEN 1 ELSE 0 END) AS deficit,
            SUM(CASE WHEN (receita - orcamento) / orcamento BETWEEN -0.10 AND 0.10 THEN 1 ELSE 0 END) AS neutro,
            SUM(CASE WHEN (receita - orcamento) / orcamento > 0.10 THEN 1 ELSE 0 END) AS superavit
        FROM filme
        WHERE LOWER(generos) LIKE ?
            AND orcamento > 0
            AND orcamento <= ?
            AND receita > 0;
    `;

    var parametros = ["%" + genero.toLowerCase() + "%", orcamento];

    return database.executar(instrucaoSql, parametros);
}

module.exports = {
    buscarReceitasDoRecorte,
    buscarDesempenhoFinanceiro
};