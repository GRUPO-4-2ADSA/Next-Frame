CREATE DATABASE IF NOT EXISTS next_frame;
USE next_frame;

CREATE TABLE Empresa (
  id_empresa          INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(100) NOT NULL,
  razao_social        VARCHAR(150) NOT NULL,
  cnpj                CHAR(14)     NOT NULL UNIQUE,
  taxa_sucesso_segura DECIMAL(5,2) NULL
);

CREATE TABLE Usuario (
  id_usuario    INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa    INT          NOT NULL,
  nome          VARCHAR(100) NOT NULL,
  cargo         ENUM('Gestor','Analista','Produtor Executivo','Analista Financeiro') NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  cpf           CHAR(11)     NOT NULL UNIQUE,
  dt_nascimento DATE         NOT NULL,
  senha         VARCHAR(255) NOT NULL,
  ativo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acesso DATETIME     NULL,
  FOREIGN KEY (id_empresa) REFERENCES Empresa (id_empresa)
);

CREATE TABLE Log (
  id_log     BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT          NOT NULL,
  categoria  VARCHAR(50)  NOT NULL,
  acao       VARCHAR(255) NOT NULL,
  dt_hora    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
);

CREATE TABLE filme (
    id_filme INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    generos VARCHAR(150),
    orcamento DECIMAL(15,2),
    receita DECIMAL(15,2),
    roi INT,
    descricao TEXT,
    produtoras VARCHAR(500),
    idioma VARCHAR(50),
    data_lanc DATE
);

CREATE TABLE Projeto (
  id_projeto     INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa     INT           NOT NULL,
  titulo         VARCHAR(255)  NOT NULL,
  ano_lancamento YEAR          NOT NULL,
  diretor        VARCHAR(100)  NOT NULL,
  sinopse        TEXT          NOT NULL,
  orcamento      DECIMAL(15,2) NOT NULL,
  receita        DECIMAL(15,2) NULL,
  genero         VARCHAR(50)   NOT NULL,
  pais           VARCHAR(100)  NOT NULL,
  idioma         VARCHAR(50)   NOT NULL,
  status         ENUM('Produzido','Em produção','Pendente') NOT NULL,
  dt_cadastro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dt_atualizacao DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES Empresa (id_empresa)
);