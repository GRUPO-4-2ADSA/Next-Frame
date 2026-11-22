
var database = require("../database/config");



function pesquisar(filtros) {
    var condicoes = [];
    var parametros = [];

    var colunas = {
        dataLancamento: "f.data_lanc",
        receita: "f.receita",
        orcamento: "f.orcamento"
    };

    var operadores = {
        maior: ">",
        igual: "=",
        menor: "<"
    };

    // Adiciona apenas os filtros selecionados
    for (var campo of Object.keys(colunas)) {
        if (!filtros[campo]) continue;

        condicoes.push(
            colunas[campo] + " " +
            operadores[filtros[campo].operador] + " ?"
        );

        parametros.push(filtros[campo].valor);
    }

    // Filtro de gênero
    if (filtros.genero) {
        var genero = filtros.genero.valor.toLowerCase()
            .replace(/=/g, "==")
            .replace(/%/g, "=%")
            .replace(/_/g, "=_");

        condicoes.push("LOWER(f.generos) LIKE ? ESCAPE '='");
        parametros.push("%" + genero + "%");
    }

    // Monta o WHERE somente quando existem filtros
    var where = condicoes.length > 0
        ? "WHERE " + condicoes.join(" AND ")
        : "";

    var instrucaoSql = `
        SELECT
            f.id_filme AS id,
            f.titulo,
            f.generos AS genero,
            f.orcamento,
            f.receita AS bilheteria,
            f.produtoras,
            COALESCE(
                f.roi,
                CASE
                    WHEN f.orcamento > 0
                    AND f.receita IS NOT NULL
                    THEN ROUND(
                        (f.receita - f.orcamento)
                        / f.orcamento * 100,
                        2
                    )
                END
            ) AS roi
        FROM filme f
        ${where}
        ORDER BY
            roi DESC,
            f.receita DESC,
            f.titulo ASC;
    `;

    console.log("Executando pesquisa histórica:", instrucaoSql);
    console.log("Parâmetros:", parametros);

    return database.executar(instrucaoSql, parametros);
}


module.exports = {
    pesquisar
};
