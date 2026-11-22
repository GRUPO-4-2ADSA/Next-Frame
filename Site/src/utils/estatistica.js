function percentil(valores, p) {
    if (valores.length === 0) return null;
    let ordenados = [...valores].sort(function (a, b) { return a - b; });
    let posicao = (p / 100) * (ordenados.length - 1);
    let base = Math.floor(posicao);
    let resto = posicao - base;
    if (ordenados[base + 1] === undefined) return ordenados[base];
    return ordenados[base] + resto * (ordenados[base + 1] - ordenados[base]);
}

function mediana(valores) {
    return percentil(valores, 50);
}

module.exports = { percentil, mediana };