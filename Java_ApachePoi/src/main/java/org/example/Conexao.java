package org.example;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import io.github.cdimascio.dotenv.Dotenv;

import static org.apache.poi.common.usermodel.HyperlinkType.URL;

public class Conexao {

    private static final Dotenv dotenv = Dotenv.load();

    private static String url = dotenv.get("DB_URL");
    private static String usuario = dotenv.get("DB_USER");
    private static String senha = dotenv.get("DB_PASSWORD");

    public static Connection conectar() throws SQLException {
        return DriverManager.getConnection(url, usuario, senha);
    }
}
