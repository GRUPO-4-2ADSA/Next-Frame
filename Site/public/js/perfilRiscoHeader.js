function abrirPerfilRisco() {
    var cargo = sessionStorage.getItem("CARGO_USUARIO");
    var idEmpresa = sessionStorage.getItem("ID_EMPRESA");

    if (!idEmpresa) {
        window.location.href = "login.html";
        return;
    }

    fetch("/risco/consultar/" + idEmpresa)
        .then(function (resposta) {
            console.log("Status da consulta:", resposta.status);

            if (!resposta.ok) {
                throw new Error("Erro ao consultar perfil de risco. Status: " + resposta.status);
            }
            return resposta.json();
        })
        .then(function (dados) {
            if (cargo == "Gestor" && !dados.perfil_risco) {
                window.location.href = "perfilRisco.html";
            } else {
                window.location.href = "resultadoRisco.html";
            }
        })
        .catch(function (erro) {
            console.log(erro);
            alert("Não foi possível consultar o perfil de risco.");
        });
}