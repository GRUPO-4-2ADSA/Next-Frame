CREATE DATABASE nextframe;
USE nextframe;

CREATE TABLE Empresa (
  idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(45),
  razao_social VARCHAR(45),
  cnpj CHAR(14)
);

CREATE TABLE Usuario (
  idUsuario INT PRIMARY KEY AUTO_INCREMENT,
  fkEmpresa INT,
  nome VARCHAR(45),
  cargo VARCHAR(45) NOT NULL,
  cpf CHAR(11),
  dtNascimento DATE,
  email VARCHAR(45),
  senha VARCHAR(45),
  FOREIGN KEY (fkEmpresa)
    REFERENCES Empresa (idEmpresa)
);

CREATE TABLE Projeto (
  idProjeto INT PRIMARY KEY AUTO_INCREMENT,
  fkEmpresa INT NOT NULL,
  titulo VARCHAR(45),
  dtLancamento DATE,
  orcamento DECIMAL(11,2),
  receita DECIMAL(11,2),
  genero VARCHAR(45),
  idioma_original VARCHAR(30),
  pais_de_producao VARCHAR(30),
  status VARCHAR(15) NOT NULL,
  FOREIGN KEY (fkEmpresa)
    REFERENCES Empresa (idEmpresa)
);

CREATE TABLE Log (
  idLog INT PRIMARY KEY,
  fkUsuario INT NOT NULL,
  categoria VARCHAR(45),
  dtHora DATE,
  acao VARCHAR(45),
  FOREIGN KEY (fkUsuario)
    REFERENCES Usuario (idUsuario)
);

CREATE TABLE Filme (
  idFilme INT PRIMARY KEY,
  titulo VARCHAR(45) NOT NULL,
  orcamento DECIMAL(11,2),
  receita DECIMAL(11,2),
  roi DECIMAL(11,2),
  genero VARCHAR(45),
  idioma_original VARCHAR(45),
  pais_de_producao VARCHAR(45),
  popularidade VARCHAR(45),
  avaliacao_media VARCHAR(45),
  qtd_de_votos INT,
  status VARCHAR(45),
  arq_origem VARCHAR(45)
);

INSERT INTO Empresa (nome, razao_social, cnpj) VALUES 
(" Ibira cultural"," Ibira cultural LTDA","12345678910111"),
(" DetonaFilmes"," DetonaLTDA","12345678910111");
        
SELECT * FROM Empresa;