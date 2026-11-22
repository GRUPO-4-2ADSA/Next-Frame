package org.example;

import java.time.LocalDateTime;

public class LogCarga {

    private Integer id;
    private String nome;
    private String acao;
    private Integer quantidade;
    private String detalhes;
    private LocalDateTime horario;

    public LogCarga(String nome, String acao, Integer quantidade, String detalhes, LocalDateTime horario) {
        this.nome = nome;
        this.acao = acao;
        this.quantidade = quantidade;
        this.detalhes = detalhes;
        this.horario = horario;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getAcao() {
        return acao;
    }

    public void setAcao(String acao) {
        this.acao = acao;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public String getDetalhes() {
        return detalhes;
    }

    public void setDetalhes(String detalhes) {
        this.detalhes = detalhes;
    }

    public LocalDateTime getHorario() {
        return horario;
    }

    public void setHorario(LocalDateTime horario) {
        this.horario = horario;
    }
}
