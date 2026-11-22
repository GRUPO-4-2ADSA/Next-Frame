let database = require("../database/config");

function buscarPerfilPorUsuario(idUsuario) {
    let instrucao = `
        SELECT e.perfil_risco
        FROM usuario u
        JOIN empresa e ON e.id_empresa = u.id_empresa
        WHERE u.id_usuario = ?;
    `;
    return database.executar(instrucao, [idUsuario]);
}

function contarFilmesRecorte(genero, orcamento) {
    let instrucao = `
        SELECT
            COUNT(*) AS total,
            COALESCE(SUM(receita > orcamento), 0) AS positivos
        FROM filme
        WHERE FIND_IN_SET(?, REPLACE(generos, ', ', ','))
          AND orcamento > 0
          AND receita > 0
          AND orcamento <= ?;
    `;
    return database.executar(instrucao, [genero, orcamento]);
}

module.exports = {
    buscarPerfilPorUsuario,
    contarFilmesRecorte
};