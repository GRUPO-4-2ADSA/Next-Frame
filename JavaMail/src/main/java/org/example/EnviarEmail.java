package org.example;

import jakarta.mail.Session; // importar a classe session da biblioteca
import java.util.Properties; // Properties é uma classe usada para guardar configurações no formato: chave valor

import jakarta.mail.Message; // é uma classe da Jakarta Mail que representa uma mensagem de e-mail
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeMessage; // e-mail no formato Mime que permite anexos e outros trecos;

import jakarta.mail.internet.InternetAddress;

import jakarta.mail.Authenticator;
import jakarta.mail.PasswordAuthentication;

public class EnviarEmail {

    public static void main(String[] args) throws Exception {


            Properties props = new Properties(); // propriedades, objeto que vai guardar configurações

            // informa ao Jakarta Mail como ele deve se conectar ao servidor SMTP.

            props.put("mail.smtp.host", "smtp.gmail.com"); // o host vai ser o gmail
            props.put("mail.smtp.port", "587");

            props.put("mail.smtp.auth", "true"); // Diz ao Jakarta Mail que o servidor exige autenticação
            props.put("mail.smtp.starttls.enable", "true");  // Diz ao Jakarta Mail para usar STARTTLS, que permite estabelecer uma conexão segura com o servidor SMTP

        // Criamos um Authenticator para fornecer usuário e senha
        Authenticator authenticator = new Authenticator() {

            // @Override significa que estamos sobrescrevend um método que já existe na classe Authenticator
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {

                return new PasswordAuthentication(
                        "thenextframe001@gmail.com",
                        "Aqui vai a senha do e-mail" // colocar depois essa no gitIgnore;
                );
            }
        };

            Session session = Session.getInstance(props, authenticator); // criamos uma sessão com essas configurações para a biblioteca trabalhar

            Message message = new MimeMessage(session); // o email que queremos enviar, vai guardar os dados do email    // mime é mais espécifico para o formato de mensagem do email

            message.setFrom(new InternetAddress("thenextframe001@gmail.com")); //pegue de, tipo quem vai enviar o email

            message.setRecipient(
                    Message.RecipientType.TO, // principal, evitar cc e tals
                    new InternetAddress("vinicius.barrero07@gmail.com")
            );

            message.setSubject("Bem-Vindo, a NextFrame");

            message.setText("Sua sessão na Next Frame já começou. Agora você tem acesso completo a todas as suas ferramentas, projetos e configurações.\n" +
                    "\n" +
                    "Explore o painel principal para continuar de onde parou ou iniciar algo inteiramente novo. Se precisar de ajuda ou suporte em qualquer etapa, nossa equipe está a apenas um clique de distância.\n" +
                    "\n" +
                    "Aproveite a experiência e tenha um ótimo trabalho!");

            Transport.send(message); // transport para enviar

        }
    }

