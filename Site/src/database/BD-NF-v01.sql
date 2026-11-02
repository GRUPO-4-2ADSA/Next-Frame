CREATE DATABASE IF NOT EXISTS next_frame;
USE next_frame;

CREATE TABLE Empresa (
  id_empresa          INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(100) NOT NULL,
  razao_social        VARCHAR(150) NOT NULL,
  cnpj                CHAR(14)     NOT NULL UNIQUE,
  taxa_sucesso_segura DECIMAL(5,2) NULL,
  cod_empresa         CHAR(8) NOT NULL,
  ultimo_acesso       DATETIME,
  perfil_risco        ENUM('Conservador', 'Moderado', 'Arrojado') DEFAULT NULL 
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
  FOREIGN KEY (id_empresa) REFERENCES Empresa (id_empresa)
);

CREATE TABLE log_carga (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    quantidade INT NOT NULL,
    detalhes TEXT,
    horario DATETIME NOT NULL,

    CONSTRAINT chk_acao_log CHECK (
        acao IN (
            'LEITURA_EXCEL',
            'FILMES_TRATADOS',
            'ERROS_TRATAMENTO',
            'INSERCAO_BANCO',
            'CARGA_FINALIZADA',
            'CARGA_INICIADA',
            'LEITURA_INICIADA'
        )
    )
);

CREATE TABLE filme (
    id_filme INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    generos VARCHAR(150),
    orcamento BIGINT,
    receita BIGINT,
    roi DOUBLE,
    descricao TEXT,
    produtoras TEXT,
    idioma TEXT,
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

CREATE TABLE HistoricoAvaliacao (
	id_historico 	INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario		INT NOT NULL,
    orcamento 		INT NOT NULL,
    receita 		INT NOT NULL,
    genero 			VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
);

INSERT INTO Empresa
    (nome, razao_social, cnpj, taxa_sucesso_segura, cod_empresa)
VALUES
    ('Ibirá Filmes', 'Ibirá Produções Cinematográficas Ltda', '12345678000190', 75.50, 'IBIRA001'),
    ('Aurora Pictures', 'Aurora Pictures Produções Ltda', '23456789000101', 82.30, 'AUROR002'),
    ('Horizonte Studios', 'Horizonte Studios Entretenimento Ltda', '34567890000112', 68.75, 'HORIZ003');
    
    select * from usuario;
    
    ALTER TABLE Usuario
ADD COLUMN foto_perfil VARCHAR(255) NULL;

SELECT * FROM filme;
SELECT COUNT(*) FROM filme;

SELECT * FROM LOG_CARGA;