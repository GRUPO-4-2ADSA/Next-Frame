let database = require("../database/config");

function buscarPerfilEmpresa(idEmpresa) {
    let instrucao = `
        SELECT perfil_risco, taxa_sucesso_segura
        FROM empresa
        WHERE id_empresa = ?;
    `;
    return database.executar(instrucao, [idEmpresa]);
}

function contarFilmesRecorte(genero, orcamento) {
    let ROI_MINIMO = 0.1;

    let instrucao = `
        SELECT
            COUNT(*) AS total,
            COALESCE(SUM(receita > orcamento * (1 + ?)), 0) AS positivos
        FROM filme
        WHERE FIND_IN_SET(?, REPLACE(generos, ', ', ','))
          AND orcamento > 0
          AND receita > 0
          AND orcamento <= ?;
    `;
    return database.executar(instrucao, [ROI_MINIMO, genero, orcamento]);
}

module.exports = { buscarPerfilEmpresa, contarFilmesRecorte };