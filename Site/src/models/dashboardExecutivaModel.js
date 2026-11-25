var database = require("../database/config");

function roiMedianoPorPeriodo(genero, primeiroAno, ultimoAno) {
    // O ROI armazenado é percentual. O gráfico exibe receita/orçamento em múltiplos.
    var instrucaoSql = `
        WITH rois_ordenados AS (
            SELECT YEAR(data_lanc) AS ano,
                   roi,
                   ROW_NUMBER() OVER (PARTITION BY YEAR(data_lanc) ORDER BY roi) AS posicao,
                   COUNT(*) OVER (PARTITION BY YEAR(data_lanc)) AS total
            FROM filme
            WHERE data_lanc >= ?
              AND data_lanc < ?
              AND roi IS NOT NULL
              AND FIND_IN_SET(
                  LOWER(?),
                  REGEXP_REPLACE(TRIM(LOWER(generos)), '[[:space:]]*,[[:space:]]*', ',')
              ) > 0
        )
        SELECT ano, 1 + AVG(roi) / 100 AS roi
        FROM rois_ordenados
        WHERE posicao IN ((total + 1) DIV 2, (total + 2) DIV 2)
        GROUP BY ano
        ORDER BY ano;
    `;

    return database.executar(instrucaoSql, [
        primeiroAno + "-01-01",
        (ultimoAno + 1) + "-01-01",
        genero
    ]);
}

module.exports = {
    roiMedianoPorPeriodo};