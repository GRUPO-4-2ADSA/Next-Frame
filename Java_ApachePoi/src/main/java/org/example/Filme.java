
package org.example;

import java.time.LocalDate;

public class Filme {

    private String titulo;
    private String generos;
    private Double orcamento;
    private Double receita;
    private Integer roi;
    private String descricao;
    private String produtoras;
    private String idioma;
    private LocalDate dataLanc;

    public Filme() {
    }

    public Filme(String titulo, String generos, Double orcamento, Double receita,
                 Integer roi, String descricao, String produtoras, String idioma,
                 LocalDate dataLanc) {
        this.titulo = titulo;
        this.generos = generos;
        this.orcamento = orcamento;
        this.receita = receita;
        this.roi = roi;
        this.descricao = descricao;
        this.produtoras = produtoras;
        this.idioma = idioma;
        this.dataLanc = dataLanc;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getGeneros() {
        return generos;
    }

    public void setGeneros(String generos) {
        this.generos = generos;
    }

    public Double getOrcamento() {
        return orcamento;
    }

    public void setOrcamento(Double orcamento) {
        this.orcamento = orcamento;
    }

    public Double getReceita() {
        return receita;
    }

    public void setReceita(Double receita) {
        this.receita = receita;
    }

    public Integer getRoi() {
        return roi;
    }

    public void setRoi(Integer roi) {
        this.roi = roi;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getProdutoras() {
        return produtoras;
    }

    public void setProdutoras(String produtoras) {
        this.produtoras = produtoras;
    }

    public String getIdioma() {
        return idioma;
    }

    public void setIdioma(String idioma) {
        this.idioma = idioma;
    }

    public LocalDate getDataLanc() {
        return dataLanc;
    }

    public void setDataLanc(LocalDate dataLanc) {
        this.dataLanc = dataLanc;
    }

    @Override
    public String toString() {
        return "Filme{" +
                "titulo='" + titulo + '\'' +
                ", generos='" + generos + '\'' +
                ", orcamento=" + orcamento +
                ", receita=" + receita +
                ", roi=" + roi +
                ", descricao='" + descricao + '\'' +
                ", produtoras='" + produtoras + '\'' +
                ", idioma='" + idioma + '\'' +
                ", dataLanc=" + dataLanc +
                '}';
    }
}
