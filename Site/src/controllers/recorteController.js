var recorteModel = require("../models/recorteModel");

function calcularMediana(receitas) {
    var quantidade = receitas.length;
    var meio = Math.floor(quantidade / 2);

    if (quantidade % 2 == 1) {
        // quantidade ímpar: o valor do meio é a mediana
        return Number(receitas[meio].receita);
    } else {
        // quantidade par: média dos dois valores do meio
        var valorA = Number(receitas[meio - 1].receita);
        var valorB = Number(receitas[meio].receita);
        return (valorA + valorB) / 2;
    }
}

function buscarReceitaMediana(req, res) {
    var genero = req.body.generoServer;
    var orcamento = Number(req.body.orcamentoServer);
    var receitaDesejada = Number(req.body.receitaServer);

    if (genero == undefined || genero == "") {
        return res.status(400).json({ mensagem: "O gênero está vazio!" });
    }
    if (!(orcamento > 0)) {
        return res.status(400).json({ mensagem: "O orçamento é inválido!" });
    }
    if (!(receitaDesejada > 0)) {
        return res.status(400).json({ mensagem: "A receita desejada é inválida!" });
    }

    recorteModel.buscarReceitasDoRecorte(genero, orcamento)
        .then(function (receitas) {
            if (receitas.length == 0) {
                return res.status(404).json({
                    mensagem: "Nenhum filme encontrado para esse recorte."
                });
            }

            var receitaMediana = calcularMediana(receitas);
            var diferenca = Math.abs(receitaDesejada - receitaMediana);
            var situacao = "igual";

            if (receitaMediana < receitaDesejada) {
                situacao = "abaixo";
            } else if (receitaMediana > receitaDesejada) {
                situacao = "acima";
            }

            res.status(200).json({
                quantidadeFilmes: receitas.length,
                receitaMediana: receitaMediana,
                receitaDesejada: receitaDesejada,
                diferenca: diferenca,
                situacao: situacao
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ mensagem: "Erro ao calcular a receita mediana." });
        });
}

module.exports = {
    buscarReceitaMediana
};