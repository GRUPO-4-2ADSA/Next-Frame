package org.example;

import jakarta.mail.Session; // importar a classe session da biblioteca
import java.util.Properties; // Properties é uma classe usada para guardar configurações no formato: chave valor

import jakarta.mail.Message; // é uma classe da Jakarta Mail que representa uma mensagem de e-mail
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeMessage; // e-mail no formato Mime que permite anexos e outros trecos;

import jakarta.mail.internet.InternetAddress;

import jakarta.mail.Authenticator;
import jakarta.mail.PasswordAuthentication;

import io.github.cdimascio.dotenv.Dotenv;

public class Email {

    private static final Dotenv dotenv = Dotenv.load();


    public void enviarEmail(String destinatario, String assunto, String conteudo) throws Exception {

        Properties props = new Properties();

        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Authenticator authenticator = new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(
                        dotenv.get("EMAIL_USER"),
                        dotenv.get("EMAIL_PASSWORD")
                );
            }
        };

        Session session = Session.getInstance(props, authenticator);

        Message message = new MimeMessage(session);

        message.setFrom(new InternetAddress("thenextframe001@gmail.com"));

        message.setRecipient(
                Message.RecipientType.TO,
                new InternetAddress(destinatario)
        );

        message.setSubject(assunto);

        message.setText(conteudo);

        Transport.send(message);

        System.out.println("Email enviado com sucesso via JavaMail");
    }
}
