package org.example;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

public class FilmeDao {

    public void inserirFilmes(List<Filme> filmes) {

        Integer filmesInseridos = 0;

        for (Filme filme : filmes) {

        String sql = """
            INSERT INTO filme
            (titulo, generos, orcamento, receita, roi, descricao,
             produtoras, idioma, data_lanc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conexao = Conexao.conectar();
             PreparedStatement comando = conexao.prepareStatement(sql)) { // classe para preparar e executar comandos sql

            comando.setString(1, filme.getTitulo());
            comando.setString(2, filme.getGeneros());
            comando.setDouble(3, filme.getOrcamento());
            comando.setDouble(4, filme.getReceita());
            comando.setInt(5, filme.getRoi());
            comando.setString(6, filme.getDescricao());
            comando.setString(7, filme.getProdutoras());
            comando.setString(8, filme.getIdioma());
            comando.setDate(9, java.sql.Date.valueOf(filme.getDataLanc()));

            Integer linhasAfetadas = comando.executeUpdate(); // comando próprio da classe

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

        System.out.println("Filmes inseridos com sucesso");
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

