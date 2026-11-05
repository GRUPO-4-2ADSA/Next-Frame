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
  foto_perfil VARCHAR(255) NULL,
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



CREATE TABLE HistoricoAvaliacao (
	id_historico 	INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario		INT NOT NULL,
    orcamento 		INT NOT NULL,
    receita 		INT NOT NULL,
    genero 			VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
);

CREATE TABLE genero (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL UNIQUE,
  termo_busca VARCHAR(100) NOT NULL UNIQUE
);

-- Série temporal mensal (valor relativo, de 0 a 100, na mesma escala para todos os gêneros)
-- data_ref = primeiro dia do mês (ex.: 2026-09-01)
-- geo = 'BR' (Brasil) ou 'WW' (mundo todo)
CREATE TABLE interesse (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fk_genero INT NOT NULL,
  data_ref DATE NOT NULL,
  valor DECIMAL(6,2) NOT NULL,
  geo VARCHAR(5) NOT NULL DEFAULT 'BR',
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interesse_genero
    FOREIGN KEY (fk_genero) REFERENCES genero(id),
  -- evita duplicar o mesmo ponto ao rodar o coletor de novo
  CONSTRAINT uq_interesse UNIQUE (fk_genero, data_ref, geo)
);

CREATE INDEX idx_interesse_data ON interesse (data_ref);

-- Gêneros (Terror primeiro: é a âncora usada pelo coletor)
INSERT INTO genero (nome, termo_busca) VALUES
  ('Terror', '/m/03npn'),
  ('Ação', '/m/02kdv5l'),
  ('Aventura', '/m/03k9fj'),
  ('Comédia', '/m/05p553'),
  ('Ficção Científica', '/m/0119r056'),
  ('Animação', '/g/120pnns2'),
  ('Suspense', '/g/122hp9x6'),
  ('Super-herói', '/m/04pbhw'),
  ('Fantasia', '/m/011869tv'),
  ('Crime', '/m/0119mbcs'),
  ('Família', '/g/1215clx1'),
  ('Musical', '/m/04t36'),
  ('Guerra', '/m/082gq'),
  ('Documentário', '/m/0jtdp'),
  ('Romance', '/m/02l7c8'),
  ('Drama', 'drama movie');

INSERT INTO Empresa
    (nome, razao_social, cnpj, taxa_sucesso_segura, cod_empresa)
VALUES
    ('Ibirá Filmes', 'Ibirá Produções Cinematográficas Ltda', '12345678000190', 75.50, 'IBIRA001'),
    ('Aurora Pictures', 'Aurora Pictures Produções Ltda', '23456789000101', 82.30, 'AUROR002'),
    ('Horizonte Studios', 'Horizonte Studios Entretenimento Ltda', '34567890000112', 68.75, 'HORIZ003');
    
USE next_frame;

INSERT INTO Usuario
    (id_empresa, nome, cargo, email, cpf, dt_nascimento, senha, ativo)
VALUES

-- IBIRÁ FILMES (ID 1)
(1, 'Carlos Oliveira', 'Gestor',
 'carlos.gestor@ibira.com', '11122233301', '1985-04-12', '123456', 1),

(1, 'Mariana Costa', 'Analista',
 'mariana.analista@ibira.com', '11122233302', '1996-08-23', '123456', 1),

(1, 'Fernando Lima', 'Produtor Executivo',
 'fernando.produtor@ibira.com', '11122233303', '1988-02-15', '123456', 1),

(1, 'Beatriz Souza', 'Analista Financeiro',
 'beatriz.financeiro@ibira.com', '11122233304', '1993-11-07', '123456', 1),

-- AURORA PICTURES (ID 2)
(2, 'Ricardo Almeida', 'Gestor',
 'ricardo.gestor@aurora.com', '22233344401', '1982-06-19', '123456', 1),

(2, 'Juliana Martins', 'Analista',
 'juliana.analista@aurora.com', '22233344402', '1997-01-30', '123456', 1),

(2, 'Gabriel Ferreira', 'Produtor Executivo',
 'gabriel.produtor@aurora.com', '22233344403', '1990-09-14', '123456', 1),

(2, 'Camila Rodrigues', 'Analista Financeiro',
 'camila.financeiro@aurora.com', '22233344404', '1994-05-26', '123456', 1),

-- HORIZONTE STUDIOS (ID 3)
(3, 'Roberto Mendes', 'Gestor',
 'roberto.gestor@horizonte.com', '33344455501', '1980-03-08', '123456', 1),

(3, 'Patricia Ribeiro', 'Analista',
 'patricia.analista@horizonte.com', '33344455502', '1995-07-21', '123456', 1),

(3, 'Lucas Barbosa', 'Produtor Executivo',
 'lucas.produtor@horizonte.com', '33344455503', '1989-12-10', '123456', 1),

(3, 'Amanda Carvalho', 'Analista Financeiro',
 'amanda.financeiro@horizonte.com', '33344455504', '1998-10-03', '123456', 1);
 