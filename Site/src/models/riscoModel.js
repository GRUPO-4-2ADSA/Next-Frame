var database = require("../database/config");

function atualizarRisco(id_empresa, risco){
        var instrucaoSql = `
            UPDATE Empresa SET perfil_risco = '${risco}'
                WHERE id_empresa = ${id_empresa}
        `;
    
        return database.executar(instrucaoSql);
};

module.exports = {
    atualizarRisco
}
