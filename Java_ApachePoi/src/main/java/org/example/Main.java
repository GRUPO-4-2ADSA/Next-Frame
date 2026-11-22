package org.example;

import java.util.List;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) throws Exception {

        LeituraExcel leitura = new LeituraExcel();

        String caminhoArquivo = "Filmes.xlsx";

        List<Filme> filmes = leitura.extracaoFilmes(caminhoArquivo);

        FilmeDao filmeDAO = new FilmeDao(); // objeto para aplicar o método

        LogCargaDao logDAO = new LogCargaDao();

        LogCarga logInicial = new LogCarga(
                "Início Carga de Filmes",
                "CARGA_INICIADA",
                0,
                "Processo de Inserção iniciado",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(logInicial);

        filmeDAO.inserirFilmes(filmes); // inserindo no banco

        LogCarga logFinal = new LogCarga(
                "Carga de filmes finalizada",
                "CARGA_FINALIZADA",
                filmes.size(),
                "Leitura e processo de inserção finalizados",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(logFinal);

        System.out.println("Processo finalizado");

        Email email = new Email();

        String mensagem = """
                Olá!
                
                Informamos que novos filmes foram adicionados ao banco de dados do Next Frame.
                
                Os dados estão disponíveis para consulta e análise no sistema.
                
                Atenciosamente,
                Equipe Next Frame
                """;

        email.enviarEmail("lucas.oalves@sptech.school", "Next Frame - Novos filmes adicionados", mensagem);

    }
}

