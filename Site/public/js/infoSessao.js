function plotarInfoUsuario() {
    let email = sessionStorage.EMAIL_USUARIO;
    let nome = sessionStorage.NOME_USUARIO;
    
    var divNomeUsuario = document.getElementById("infoNome");
    
    if (email != null && nome != null) {
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