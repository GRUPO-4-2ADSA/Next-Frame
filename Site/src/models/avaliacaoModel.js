var database = require("../database/config");

function salvarDash(idUsuario, orcamento, receita, genero) {
    var instrucaoSql = `
        INSERT INTO HistoricoAvaliacao
            (id_usuario, orcamento, receita, genero)
        VALUES
            ('${idUsuario}', '${orcamento}', '${receita}', '${genero}');
    `;

    return database.executar(instrucaoSql);
}

function buscarHistorico(idUsuario) {
    var instrucaoSql = `
        SELECT
            orcamento,
            receita,
            genero,
            id_historico AS idAvaliacao
        FROM HistoricoAvaliacao
            WHERE id_usuario = '${idUsuario}'
        ORDER BY id_historico DESC
        LIMIT 5;
    `;

    return database.executar(instrucaoSql);
}

function excluirAvaliacao(idAvaliacao) {
    var instrucaoSql = `
        DELETE FROM historicoAvaliacao
            WHERE id_historico = '${idAvaliacao}';
    `;

    return database.executar(instrucaoSql);
}

function editarAvaliacao(idAvaliacao, orcamento, receita, genero) {
    var instrucaoSql = `
        UPDATE HistoricoAvaliacao
        SET orcamento = ${orcamento}, receita = ${receita}, genero = '${genero}'
            WHERE id_historico = ${idAvaliacao};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    salvarDash,
    buscarHistorico,
    excluirAvaliacao,
    editarAvaliacao
};