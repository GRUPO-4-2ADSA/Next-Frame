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

// Correlação de Pearson entre dois conjuntos (-1 a 1)
function correlacao(x, y) {
    let n = x.length;
    if (n < 2) return null;

    let mediaX = x.reduce(function (a, b) { return a + b; }, 0) / n;
    let mediaY = y.reduce(function (a, b) { return a + b; }, 0) / n;

    let soma = 0;
    let varX = 0;
    let varY = 0;

    for (let i = 0; i < n; i++) {
        soma += (x[i] - mediaX) * (y[i] - mediaY);
        varX += (x[i] - mediaX) ** 2;
        varY += (y[i] - mediaY) ** 2;
    }

    if (varX === 0 || varY === 0) return null;
    return soma / Math.sqrt(varX * varY);
}

// Reta de tendência: y = a * x + b
function regressao(x, y) {
    let n = x.length;
    if (n < 2) return null;

    let mediaX = x.reduce(function (a, b) { return a + b; }, 0) / n;
    let mediaY = y.reduce(function (a, b) { return a + b; }, 0) / n;

    let soma = 0;
    let varX = 0;

    for (let i = 0; i < n; i++) {
        soma += (x[i] - mediaX) * (y[i] - mediaY);
        varX += (x[i] - mediaX) ** 2;
    }

    if (varX === 0) return null;

    let a = soma / varX;
    return { a: a, b: mediaY - a * mediaX };
}

// Limites do IQR para detectar outliers
function limitesIQR(valores) {
    let q1 = percentil(valores, 25);
    let q3 = percentil(valores, 75);
    let iqr = q3 - q1;
    return { min: q1 - 1.5 * iqr, max: q3 + 1.5 * iqr };
}

module.exports = { percentil, mediana, correlacao, regressao, limitesIQR };