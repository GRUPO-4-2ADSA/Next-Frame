
package org.example;

import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.eventusermodel.ReadOnlySharedStringsTable;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.model.StylesTable;
import org.apache.poi.xssf.usermodel.XSSFComment;
import org.apache.poi.util.XMLHelper;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class LeituraExcel {

    private Integer falhasTratamento = 0;
    private Integer filmesDescartados = 0;

    public List<Filme> extracaoFilmes(String caminhoArquivo) {

        falhasTratamento = 0;
        filmesDescartados = 0;

        List<Filme> filmesExtraidos = new ArrayList<>(); // Lista que guarda os filmes válidos

        try (OPCPackage pacoteExcel = OPCPackage.open(caminhoArquivo)) { // Abre o arquivo Excel

            XSSFReader leitorExcel = new XSSFReader(pacoteExcel); // Ler o arquivo excel

            StylesTable estilosExcel = leitorExcel.getStylesTable(); // Obtém os estilos das células

            ReadOnlySharedStringsTable textosCompartilhados =
                    new ReadOnlySharedStringsTable(pacoteExcel); // Acessa os textos armazenados no Excel

            XSSFReader.SheetIterator planilhas =
                    (XSSFReader.SheetIterator) leitorExcel.getSheetsData(); // Acessa as planilhas do arquivo

            try (InputStream entradaPlanilha = planilhas.next()) { // Abre a primeira planilha

                XMLReader leitorXML = XMLHelper.newXMLReader();// Cria o leitor para ler os xml que compoem o xlsx

                System.out.println("Inicia leitura");
                registrarInicioLeitura();

                leitorXML.setContentHandler( // Bloco responsável por entender o conteudo que tem no xml
                        new XSSFSheetXMLHandler( // classe responsavel pela leitura
                                estilosExcel, // Informações de formatação das células
                                null, // Não vamos tratar comentários das células
                                textosCompartilhados, // Permite recuperar os textos do Excel

                                new XSSFSheetXMLHandler.SheetContentsHandler() { // sheetContentsHandler é uma interface que delimita que a classe do lado tenha que usar os outros 3 métodos

                                    private String[] dadosLinha; //

                                    public void startRow(int numeroLinha) {
                                        dadosLinha = new String[16]; // Cria um vetor para as 16 colunas necessárias
                                    }

                                        public void cell(String referenciaCelula, String valorCelula,
                                                         XSSFComment comentario) {

                                            if (referenciaCelula == null) {
                                                return; // Ignora células sem referência
                                            }

                                            int indiceColuna =
                                                    new CellReference(referenciaCelula).getCol(); // Obtém o índice da coluna a partir do b2 (a vira 0, b vira1_

                                            if (indiceColuna < dadosLinha.length) {
                                                dadosLinha[indiceColuna] = valorCelula; // Guarda o valor no vetor
                                            }
                                        }

                                    public void endRow(int numeroLinha) {

                                        if (numeroLinha == 0) {
                                            return; // Pular cabeçalho
                                        }

                                        if ((numeroLinha + 1) % 10000 == 0) {
                                            registrarProgressoLeitura(numeroLinha + 1);
                                        }

                                        String titulo = dadosLinha[1]; // Coluna B: título do filme
                                        String dataTexto = dadosLinha[5]; // Coluna F: data de lançamento
                                        String receitaTexto = dadosLinha[6]; // Coluna G: receita
                                        String orcamentoTexto = dadosLinha[8]; // Coluna I: orçamento
                                        String idioma = dadosLinha[10]; // Coluna K: idioma original
                                        String descricao = dadosLinha[12]; // Coluna M: descrição
                                        String generos = dadosLinha[14]; // Coluna O: gêneros
                                        String produtoras = dadosLinha[15]; // Coluna P: produtoras

                                        if (titulo == null || titulo.isBlank()
                                                || dataTexto == null || dataTexto.isBlank()
                                                || receitaTexto == null || receitaTexto.isBlank()
                                                || orcamentoTexto == null || orcamentoTexto.isBlank()
                                                || generos == null || generos.isBlank()) {

                                            filmesDescartados++;
                                            return; // Pular as linhas sem os dados obrigatórios
                                        }

                                        try {
                                            Double receita = Double.parseDouble(receitaTexto); //
                                            Double orcamento = Double.parseDouble(orcamentoTexto);

                                            if (receita == 0.0 || orcamento == 0.0) {
                                                filmesDescartados++;
                                                return; //
                                            }

                                            LocalDate dataLancamento = LocalDate.parse(
                                                    dataTexto,
                                                    DateTimeFormatter.ofPattern("M/d/uuuu", Locale.US)
                                            ); // Converte a data do Excel em uma data Java

                                            Integer roi = (int) (((receita - orcamento)
                                                    / orcamento) * 100); //

                                            Filme filme = new Filme(
                                                    titulo,
                                                    generos,
                                                    orcamento,
                                                    receita,
                                                    roi,
                                                    descricao,
                                                    produtoras,
                                                    idioma,
                                                    dataLancamento
                                            );

                                            filmesExtraidos.add(filme); // Adiciona o filme à lista

                                        } catch (RuntimeException erro) {

                                            falhasTratamento++;

                                            System.err.println(
                                                    "Linha ignorada: " + (numeroLinha + 1)
                                                            + " - " + erro.getMessage()


                                            ); // Exibe o motivo pelo qual a linha foi ignorada
                                        }
                                    }
                                },
                                new DataFormatter(Locale.US), // Formata os valores lidos como textos
                                false // Não inclui informações de formatação no texto retornado
                        )
                );

                leitorXML.parse(new InputSource(entradaPlanilha)); // Inicia a leitura da planilha
            }

            System.out.println("Filmes extraídos: " + filmesExtraidos.size());

            registrarFalhasTratamento(falhasTratamento);
            registrarFilmesDescartados(filmesDescartados);

            return filmesExtraidos; // Retorna a lista de filmes válidos

        } catch (Exception erro) {
            throw new RuntimeException("Erro ao ler o arquivo Excel", erro); // Informa falhas na leitura do arquivo
        }
    }

    public void registrarInicioLeitura() {

        LogCargaDao logDAO = new LogCargaDao();

        LogCarga log = new LogCarga(
                "Inicio Leitura Filmes",
                "LEITURA_INICIADA",
                0,
                "Início da leitura do excel",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(log);
    }

    public void registrarProgressoLeitura(Integer quantidade) {

        LogCargaDao logDAO = new LogCargaDao();

        LogCarga log = new LogCarga(
                "Leitura de filmes",
                "LEITURA_EXCEL",
                quantidade,
                "Linhas processadas durante a leitura do Excel",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(log);
    }

    private void registrarFalhasTratamento(Integer quantidade) {
        LogCargaDao logDAO = new LogCargaDao();

        LogCarga log = new LogCarga(
                "Total de falhas",
                "ERROS_TRATAMENTO",
                quantidade,
                "Falhas durante o tratamento dos filmes",
                java.time.LocalDateTime.now()
        );
        logDAO.inserirLog(log);
    }

    private void registrarFilmesDescartados(Integer quantidade) {
        LogCargaDao logDAO = new LogCargaDao();

        LogCarga log = new LogCarga(
                "Filmes descartados",
                "ERROS_TRATAMENTO",
                quantidade,
                "Filmes descartados por ausência de dados obrigatórios",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(log);
    }

}


