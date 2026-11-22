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

module.exports = {
    buscarReceitasDoRecorte
};