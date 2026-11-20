function plotarInfoUsuario() {
    let email = sessionStorage.EMAIL_USUARIO;
    let nome = sessionStorage.NOME_USUARIO;

    var divNomeUsuario = document.getElementById("infoNome");

    if (email != null && nome != null) {
        var id = sessionStorage.getItem("ID_USUARIO");

        fetch(`/usuarios/perfil/${id}`)
            .then(function (resposta) {
                return resposta.json();
            })
            .then(function (dados) {
                if (dados.foto_perfil) {
                    fotoPerfilHeader.src = dados.foto_perfil;
                    fotoPerfilHeader.style.width = "115%";
                    fotoPerfilHeader.style.height = "115%";
                    fotoPerfilHeader.style.objectFit = "cover";
                    fotoPerfilHeader.style.objectPosition = "center";
                    fotoPerfilHeader.style.borderRadius = "50%";
                }
            })
            .catch(function (erro) {
                console.log("Erro ao buscar foto:", erro);
            });

        let nomeDividido = nome.split(` `);
        divNomeUsuario.innerHTML = nomeDividido[0];
    } else {
        window.location = "../login.html";
    }
}

function sair() {
    sessionStorage.clear();
    window.location = "../index.html";
}