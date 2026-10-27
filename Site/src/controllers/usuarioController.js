var usuarioModel = require("../models/usuarioModel");

function cadastrar(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var senha = req.body.senhaServer;
    var email = req.body.emailServer;
    var cpf = req.body.cpfServer;
    var dtNascimento = req.body.dtNascimentoServer;
    var empresa = req.body.empresaServer;
    var cargo = req.body.cargoServer;

    // Faça as validações dos valores
    if (nome == undefined) {
        res.status(400).send("Preencha o campo nome!");
    } else if (email == undefined) {
        res.status(400).send("Preencha o campo email!");
    } else if (senha == undefined) {
        res.status(400).send("Preencha o campo senha!");
    } else if (cpf == undefined) {
        res.status(400).send("Preencha o campo de cpf!");
    } else if (dtNascimento == undefined) {
        res.status(400).send("Preencha o campo de data de nascimento!");
    } else if (empresa == undefined) {
        res.status(400).send("Preencha o campo de empresa!");
    } else if (cargo == undefined) {
        res.status(400).send("Preencha o campo de cargo!");
    } else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        usuarioModel.cadastrar(nome, cargo, cpf, dtNascimento, email, senha, empresa)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está indefinida!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else {

        usuarioModel.autenticar(email, senha)
            .then(
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`); // transforma JSON em String

                    if (resultadoAutenticar.length == 1) {
                        console.log(resultadoAutenticar);
                        res.status(200).json(resultadoAutenticar[0]);
                        // Esse res.status(200) comunica o front que deu tudo certo e envia os dados pra ele salvar no sessionStorage
                    } else if (resultadoAutenticar.length == 0) {
                        res.status(403).send("email e/ou senha inválido(s)");
                    } else {
                        res.status(403).send("Mais de um usuário com o mesmo email e senha!");
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

}

function listar(req, res) {
    var idEmpresa = req.params.idEmpresa;

    usuarioModel.listar(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro);
        });
}


function buscarPorId(req, res) {
    var id = req.params.id;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ mensagem: "ID inválido." });
    }

    usuarioModel.buscarPorId(id)
        .then(function (resultado) {
            if (resultado.length === 0) {
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }

            res.status(200).json(resultado[0]);
        })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Erro ao buscar usuário." });
        });
}


function editar(req, res) {
    var id = req.params.id;
    var dados = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensagem: "ID inválido."
        });
    }

    var camposObrigatorios = [
        "nomeServer",
        "emailServer",
        "cpfServer",
        "dtNascimentoServer",
        "empresaServer",
        "cargoServer"
    ];

    for (var i = 0; i < camposObrigatorios.length; i++) {
        var campo = dados[camposObrigatorios[i]];

        if (campo === undefined || campo === null || campo === "") {
            return res.status(400).json({
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }
    }

    usuarioModel.buscarPorId(id)
        .then(function (usuario) {
            if (usuario.length === 0) {
                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });
            }

            return usuarioModel.editar(id, dados)
                .then(function () {
                    return res.status(200).json({
                        mensagem: "Usuário atualizado com sucesso."
                    });
                });
        })
        .catch(function (erro) {
            console.error("Erro ao editar usuário:", erro);

            return res.status(500).json({
                mensagem: "Erro ao editar usuário."
            });
        });
}


function excluir(req, res) {
    var id = req.params.id;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ mensagem: "ID inválido." });
    }

    usuarioModel.buscarPorId(id)
        .then(function (usuario) {
            if (usuario.length === 0) {
                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });
            }

            return usuarioModel.excluir(id)
                .then(function () {
                    res.status(200).json({
                        mensagem: "Usuário excluído com sucesso."
                    });
                });
        })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({
                mensagem: "Erro ao excluir usuário."
            });
        });
}


function buscarHistorico(req, res) {
    var id = req.params.id;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ mensagem: "ID inválido." });
    }

    usuarioModel.buscarHistorico(id)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Erro ao consultar histórico." });
        });
}

function listarEmpresas(req, res) {
    usuarioModel.listarEmpresas()
        .then(function (empresas) {
            res.status(200).json(empresas);
        })
        .catch(function (erro) {
            console.error("Erro ao listar empresas:", erro);
            res.status(500).json({
                mensagem: "Erro ao listar empresas."
            });
        });
}
module.exports = {
    cadastrar,
    autenticar,
    listar,
    buscarPorId,
    editar,
    excluir,
    buscarHistorico,
    listarEmpresas
};