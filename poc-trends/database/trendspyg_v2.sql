-- v2: 16 gêneros identificados por MID, valor decimal, país 'WW' para mundial
-- ATENÇÃO: este script APAGA e recria as tabelas genero e interesse.

CREATE DATABASE IF NOT EXISTS poc_trends
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE poc_trends;

-- Apaga primeiro a tabela que depende da outra (chave estrangeira)
DROP TABLE IF EXISTS interesse;
DROP TABLE IF EXISTS genero;

-- Gêneros acompanhados
-- termo_busca guarda o MID do Google (ex.: /m/03npn) ou, quando não há tópico, um texto
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

-- Conferência: deve listar 16 gêneros
SELECT id, nome, termo_busca FROM genero ORDER BY id;

SET @escolhido = 'Romance';

SELECT g.nome, i.data_ref, i.valor
FROM poc_trends.interesse i
JOIN poc_trends.genero g ON g.id = i.fk_genero
WHERE i.data_ref > DATE_SUB((SELECT MAX(data_ref) FROM poc_trends.interesse), INTERVAL 12 MONTH)
  AND (g.nome = @escolhido OR g.id IN (
        SELECT id FROM (
          SELECT i2.fk_genero AS id
          FROM poc_trends.interesse i2
          WHERE i2.data_ref > DATE_SUB((SELECT MAX(data_ref) FROM poc_trends.interesse), INTERVAL 12 MONTH)
          GROUP BY i2.fk_genero
          ORDER BY AVG(i2.valor) DESC
          LIMIT 5
        ) top5
  ))
ORDER BY g.nome, i.data_ref;

SELECT i.data_ref, i.valor,
  TIMESTAMPDIFF(MONTH, i.data_ref,
    (SELECT MAX(data_ref) FROM poc_trends.interesse)) AS meses_atras
FROM poc_trends.interesse i
JOIN poc_trends.genero g ON g.id = i.fk_genero
WHERE g.nome = 'Terror'
ORDER BY i.data_ref;

