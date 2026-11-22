var database = require("../database/config");

function atualizarRisco(id_empresa, risco) {
    var instrucaoSql = `
            UPDATE empresa SET perfil_risco = '${risco}'
                WHERE id_empresa = ${id_empresa}
        `;

    return database.executar(instrucaoSql);
};

function consultarRisco(idEmpresa) {
    var instrucaoSql = `
        SELECT perfil_risco
        FROM empresa
        WHERE id_empresa = ${Number(idEmpresa)};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    atualizarRisco,
    consultarRisco
}
