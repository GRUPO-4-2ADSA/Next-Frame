
package org.example;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class LogCargaDao {

    public void inserirLog(LogCarga log) {

        String sql = """
                INSERT INTO log_carga
                (nome, acao, quantidade, detalhes, horario)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (Connection conexao = Conexao.conectar();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, log.getNome());
            comando.setString(2, log.getAcao());
            comando.setInt(3, log.getQuantidade());
            comando.setString(4, log.getDetalhes());
            comando.setTimestamp(5, java.sql.Timestamp.valueOf(log.getHorario()));

            comando.executeUpdate();

        } catch (SQLException erro) {
            erro.printStackTrace();
        }
    }
}
