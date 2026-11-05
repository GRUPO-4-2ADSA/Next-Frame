package org.example;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

public class FilmeDao {


    public void inserirFilmes(List<Filme> filmes) {

        Integer filmesInseridos = 0;
        Integer filmesDuplicados = 0;

        String verificarSql = """
                SELECT COUNT(*) FROM filme
                WHERE titulo = ? AND data_lanc = ?
                """;

        String inserirSql = """
                INSERT INTO filme
                (titulo, generos, orcamento, receita, roi, descricao,
                 produtoras, idioma, data_lanc)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        for (Filme filme : filmes) {

            try (Connection conexao = Conexao.conectar();
                 PreparedStatement verificar = conexao.prepareStatement(verificarSql);
                 PreparedStatement comando = conexao.prepareStatement(inserirSql)) {

                verificar.setString(1, filme.getTitulo());
                verificar.setDate(2, java.sql.Date.valueOf(filme.getDataLanc()));

                java.sql.ResultSet resultado = verificar.executeQuery();

                if (resultado.next() && resultado.getInt(1) > 0) {
                    filmesDuplicados++;
                    continue;
                }

                comando.setString(1, filme.getTitulo());
                comando.setString(2, filme.getGeneros());
                comando.setDouble(3, filme.getOrcamento());
                comando.setDouble(4, filme.getReceita());
                comando.setInt(5, filme.getRoi());
                comando.setString(6, filme.getDescricao());
                comando.setString(7, filme.getProdutoras());
                comando.setString(8, filme.getIdioma());
                comando.setDate(9, java.sql.Date.valueOf(filme.getDataLanc()));

                Integer linhasAfetadas = comando.executeUpdate();

                if (linhasAfetadas > 0) {
                    filmesInseridos++;

                    if (filmesInseridos % 500 == 0) {
                        registrarProgressoInsercao(filmesInseridos);
                    }
                }

            } catch (SQLException erro) {
                erro.printStackTrace();
            }
        }

        System.out.println("Filmes inseridos: " + filmesInseridos);
        System.out.println("Filmes duplicados ignorados: " + filmesDuplicados);
    }

    public void registrarProgressoInsercao(Integer quantidade) {
        LogCargaDao logDAO = new LogCargaDao();

        LogCarga log = new LogCarga(
                "Carga de filmes",
                "INSERCAO_BANCO",
                quantidade,
                "Filmes inseridos no banco de dados",
                java.time.LocalDateTime.now()
        );

        logDAO.inserirLog(log);
    }
}


