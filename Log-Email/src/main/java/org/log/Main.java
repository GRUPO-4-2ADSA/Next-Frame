package org.log;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import java.time.format.DateTimeFormatter;


public class Main {

    public static void main(String[] args) throws Exception {

        List<String> nomeFilme = new ArrayList<>();
        List<String> diretorFilme = new ArrayList<>();
        List<String> generoFilme = new ArrayList<>();
        List<Double> orcamentoFilme = new ArrayList<>();
        List<Double> receitaFilme = new ArrayList<>();
        List<Integer> anoFilme = new ArrayList<>();

        List<String> logs = new ArrayList<>();

        Scanner sc = new Scanner(System.in);
        Scanner scNextLine = new Scanner(System.in);

        Email email = new Email();

        String usuario = "Ibirá Cultural";

        Integer idLog = 1;

        Integer resposta = 0;

        while (resposta != 4) {

            System.out.println("""
                    
                    Bem-vindo, Ibirá Cultural!
                    
                    Digite o que deseja fazer:
                    
                    1 - Adicionar um filme ao seu Portfólio.
                    2 - Listar os filmes do seu Portfólio.
                    3 - Remover um filme do Portfólio.
                    4 - Sair.
                    5 - Visualizar Logs.
                    6 - Enviar Relatório por e-mail.
                    """);

            resposta = sc.nextInt();

            while (resposta < 1 || resposta > 6) {

                System.out.println("Opção inválida - Digite novamente:");
                resposta = sc.nextInt();
            }

            switch (resposta) {

                case 1:

                    System.out.println("Digite o nome do filme:");
                    String nome = scNextLine.nextLine();

                    nomeFilme.add(nome);

                    System.out.println("Digite o diretor do filme:");
                    String diretor = scNextLine.nextLine();

                    diretorFilme.add(diretor);

                    System.out.println("Digite o ano do filme:");
                    Integer ano = sc.nextInt();

                    anoFilme.add(ano);

                    System.out.println("Digite o gênero do filme:");
                    String genero = scNextLine.nextLine();

                    generoFilme.add(genero);

                    System.out.println("Digite o orçamento do filme: (somente números)");
                    Double orcamento = sc.nextDouble();

                    orcamentoFilme.add(orcamento);

                    System.out.println("Digite a receita do filme: (somente números)");
                    Double receita = sc.nextDouble();

                    receitaFilme.add(receita);

                    System.out.println("Filme cadastrado com sucesso!");

                    // -------------------------------------------------- //

                    criarLog(logs, idLog, "CADASTRO_FILME", usuario, nome); // Estou chamando o método de criar log

                    idLog++;

                    System.out.println("Pressione ENTER para voltar ao menu...");
                    scNextLine.nextLine();

                    break;

                case 2:

                    if (nomeFilme.isEmpty()) {

                        System.out.println("Nenhum filme cadastrado.");

                    } else {

                        System.out.println("\nFilmes cadastrados:");

                        for (int i = 0; i < nomeFilme.size(); i++) {

                            System.out.println("-------------------------");
                            System.out.println("Filme: " + (i + 1));
                            System.out.println("Nome: " + nomeFilme.get(i));
                            System.out.println("Diretor: " + diretorFilme.get(i));
                            System.out.println("Ano: " + anoFilme.get(i));
                            System.out.println("Gênero: " + generoFilme.get(i));
                            System.out.println("Orçamento: " + orcamentoFilme.get(i));
                            System.out.println("Receita: " + receitaFilme.get(i));
                        }

                        System.out.println("-------------------------");

                        // -------------------------------------------------- //

                        criarLog(logs, idLog, "LISTAGEM_FILMES", usuario, "-"); // Estou chamando o método de criar log

                        idLog++;
                    }

                    System.out.println("Pressione ENTER para voltar ao menu...");
                    scNextLine.nextLine();

                    break;

                case 3:

                    if (nomeFilme.isEmpty()) {

                        System.out.println("Nenhum filme cadastrado.");

                        break;
                    }

                    System.out.println("\nFilmes cadastrados:");

                    for (int i = 0; i < nomeFilme.size(); i++) {

                        System.out.println((i + 1) + " - " + nomeFilme.get(i));
                    }

                    System.out.println("\nDigite o número do filme que deseja apagar:");
                    System.out.println("Digite 0 para voltar ao menu:");

                    Integer respostaApagar = sc.nextInt();

                    if (respostaApagar == 0) {

                        System.out.println("Voltando ao menu...");

                    } else if (respostaApagar < 1 ||
                            respostaApagar > nomeFilme.size()) {

                        System.out.println("Número de filme inválido!");

                    } else {

                        int indice = respostaApagar - 1;

                        String filme = nomeFilme.get(indice);

                        nomeFilme.remove(indice);
                        diretorFilme.remove(indice);
                        generoFilme.remove(indice);
                        orcamentoFilme.remove(indice);
                        receitaFilme.remove(indice);
                        anoFilme.remove(indice);

                        System.out.println("Filme removido com sucesso!");

                        System.out.println("-------------------------");

                        // -------------------------------------------------- // Caso de dúvida, pode mandar mensagem no pv

                        criarLog(logs, idLog, "REMOCAO_FILME", usuario, filme); // Estou chamando o método de criar log

                        idLog++;
                    }

                    System.out.println("Pressione ENTER para voltar ao menu...");
                    scNextLine.nextLine();

                    break;

                case 4:

                    System.out.println("Saindo do sistema!");

                    break;

                case 5:

                    if (logs.isEmpty()) {
                        System.out.println("Nenhum log registrado.");
                    } else {

                        System.out.println("""
                                ===============================
                                LOG DO SISTEMA
                                ===============================""");

                        for (int i = 0; i < logs.size(); i++) {

                            System.out.println(logs.get(i));
                            System.out.println("------------------------------");

                        }
                        ;
                    }

                    System.out.println("Pressione ENTER para voltar ao menu...");
                    scNextLine.nextLine();

                    break;

                case 6:

                    if (logs.isEmpty()) {
                        System.out.println("Nenhum log registrado.");
                    } else {

                        String mensagem = "";

                        for (int i = 0; i < logs.size() ; i++) {

                            mensagem+= logs.get(i) + "\n";

                        }

                        email.enviarEmail("yurirav01@gmail.com", "Histórico de Logs", mensagem);

                        System.out.println("Pressione ENTER para voltar ao menu...");
                        scNextLine.nextLine();

                    }

                    break;

                default:

                    System.out.println("Opção inválida.");

                    break;
            }
        }

    }

    public static void criarLog(
            List<String> logs,
            Integer id,
            String categoria,
            String usuario,
            String filme
    ) {

        String descricao = "";

        if (categoria.equals("CADASTRO_FILME")) {
            descricao = "Usuário Cadastrou um filme do Portfólio";

        } else if (categoria.equals("REMOCAO_FILME")) {
            descricao = "Usuário Removeu um filme do Portfólio";

        } else if (categoria.equals("LISTAGEM_FILMES")) {
            descricao = "Usuário consultou o portfólio";
        }

        LocalDateTime dataHora = LocalDateTime.now();

        DateTimeFormatter formatador =
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        String log = """
            ID: %d
            Categoria: %s
            Usuário: %s
            Filme: %s
            Data/Hora: %s
            Ação: %s
            ------------------------------
            """.formatted(
                id,
                categoria,
                usuario,
                filme,
                dataHora.format(formatador),
                descricao
        );

        logs.add(log);
    }

}


