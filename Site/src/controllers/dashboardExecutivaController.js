var dashboardExecutivaModel = require("../models/dashboardExecutivaModel");

async function roiMedianoPorPeriodo(req, res) {
    var periodo = req.query.periodo ?? "10";
    var genero = req.query.genero;

    if (!["5", "10", "15", "20", "25"].includes(periodo)) {
        return res.status(400).json({ mensagem: "Período inválido. Escolha 5, 10, 15, 20 ou 25 anos." });
    }

    if (typeof genero !== "string" || genero.length > 20 || !/^[a-z]+(?: [a-z]+)*$/i.test(genero)) {
        return res.status(400).json({ mensagem: "Informe um gênero válido para consultar o ROI mediano." });
    }

    // Mantém o último ano do recorte histórico exibido no gráfico de referência.
    var ultimoAno = 2024;
    var quantidadeAnos = Number(periodo);
    var primeiroAno = ultimoAno - quantidadeAnos + 1;

    try {
        var medianas = await dashboardExecutivaModel.roiMedianoPorPeriodo(genero, primeiroAno, ultimoAno);
        var roiPorAno = new Map(medianas.map(({ ano, roi }) => [Number(ano), Number(roi)]));
        var serie = Array.from({ length: quantidadeAnos }, (_, indice) => {
            var ano = primeiroAno + indice;
            return { ano, roi: roiPorAno.get(ano) ?? null };
        });

        return res.json(serie);
    } catch (erro) {
        console.error("Erro ao buscar o ROI mediano por período:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar o ROI mediano por período." });
    }
}

module.exports = { 
    roiMedianoPorPeriodo};
