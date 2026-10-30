
var database = require("../database/config");

function cadastrar(nome, cargo, cpf, dtNascimento, email, senha, empresa) {
    var instrucaoSql = `
        INSERT INTO Usuario
            (nome, cargo, cpf, dt_nascimento, email, senha, id_empresa)
        VALUES
            ('${nome}', '${cargo}', '${cpf}', '${dtNascimento}', '${email}', '${senha}', '${empresa}');
    `;

    return database.executar(instrucaoSql);
}

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT
            id_usuario AS id,
            nome,
            email,
            senha,
            cargo,
            id_empresa
        FROM Usuario
        WHERE email = '${email}'
          AND senha = '${senha}';
    `;

    return database.executar(instrucaoSql);
}

function verificarCodEmpresa(codEmpresa) {
    var instrucaoSql = `
        SELECT EXISTS (
            SELECT 1
            FROM Empresa
            WHERE cod_empresa = '${codEmpresa}'
        ) AS existe,
        (
        SELECT id_empresa
        FROM Empresa
        WHERE cod_empresa = '${codEmpresa}'
        ) AS id_empresa;
    `;

    return database.executar(instrucaoSql);
}

function listar(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.id_usuario AS id,
            u.nome,
            u.email,
            u.cpf,
            u.dt_nascimento,
            u.id_empresa,
            e.nome AS empresa,
            u.cargo,
            u.ultimo_acesso
        FROM Usuario u
        INNER JOIN Empresa e
            ON u.id_empresa = e.id_empresa
        WHERE u.id_empresa = ?
        ORDER BY u.nome;
    `;

    console.log("Executando SQL:", instrucaoSql);

    return database.executar(instrucaoSql, [idEmpresa]);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT
            u.id_usuario AS id,
            u.nome,
            u.email,
            u.cpf,
            u.dt_nascimento,
            u.id_empresa,
            e.nome AS empresa,
            u.cargo,
            u.ultimo_acesso
        FROM Usuario u
        INNER JOIN Empresa e
            ON u.id_empresa = e.id_empresa
        WHERE u.id_usuario = ${id};
    `;

    return database.executar(instrucaoSql);
}

function editar(id, dados) {
    var instrucaoSql = `
        UPDATE Usuario
        SET
            nome = '${dados.nomeServer}',
            email = '${dados.emailServer}',
            cpf = '${dados.cpfServer}',
            dt_nascimento = '${dados.dtNascimentoServer}',
            id_empresa = '${dados.empresaServer}',
            cargo = '${dados.cargoServer}'
        WHERE id_usuario = ${id};
    `;

    return database.executar(instrucaoSql);
}

function excluir(id) {
    var instrucaoSqlLog = `
        DELETE FROM Log
        WHERE id_usuario = ${id};
    `;

    var instrucaoSqlUsuario = `
        DELETE FROM Usuario
        WHERE id_usuario = ${id};
    `;

    return database.executar(instrucaoSqlLog)
        .then(function () {
            return database.executar(instrucaoSqlUsuario);
        });
}

function buscarHistorico(id) {
    var instrucaoSql = `
        SELECT
            id_log,
            categoria,
            acao,
            dt_hora
        FROM Log
        WHERE id_usuario = ${id}
        ORDER BY dt_hora DESC;
    `;

    return database.executar(instrucaoSql);
}

function listarEmpresas() {
    var instrucaoSql = `
        SELECT id_empresa, nome
        FROM Empresa
        ORDER BY nome;
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar,
    verificarCodEmpresa,
    autenticar,
    listar,
    buscarPorId,
    editar,
    excluir,
    buscarHistorico,
    listarEmpresas
};
