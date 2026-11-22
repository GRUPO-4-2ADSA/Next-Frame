-- =====================================================================
-- PoC Google Trends - interesse do público por gêneros de filmes (v3)
-- =====================================================================

DROP DATABASE IF EXISTS nextframe_trendspyg;
CREATE DATABASE nextframe_trendspyg;
USE nextframe_trendspyg;

-- ---------------------------------------------------------------------
-- Gêneros e o termo usado na busca (MID do Google Trends)
-- ---------------------------------------------------------------------
CREATE TABLE pesquisa_mid (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL UNIQUE,
    termo_busca VARCHAR(100) NOT NULL
);

-- ---------------------------------------------------------------------
-- Interesse mensal de cada gênero (escala de 0 a 100)
-- fk_genero aponta para pesquisa_mid.id
-- ---------------------------------------------------------------------
CREATE TABLE interesse (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_genero INT NOT NULL,
    data_ref DATE NOT NULL,                         -- sempre o dia 1 do mês
    valor DECIMAL(6,2) NOT NULL,
    geo VARCHAR(5) NOT NULL,                        -- "BR" ou "WW" - configurado no arquivo python
    coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interesse_genero
        FOREIGN KEY (fk_genero) REFERENCES pesquisa_mid (id),
    -- Necessário para o ON DUPLICATE KEY UPDATE do coletor:
    -- um valor por gênero, por mês, por região
    CONSTRAINT uq_interesse UNIQUE (fk_genero, data_ref, geo)
);

-- ---------------------------------------------------------------------
-- Os 19 gêneros com os MIDs escolhidos com o auxilio do buscar_mids.py (categoria Filmes no Trends)
-- ---------------------------------------------------------------------
INSERT INTO pesquisa_mid (nome, termo_busca) VALUES
    ('Action', '/m/02kdv5l'),
    ('Adventure', '/m/03k9fj'),
    ('Animation', '/g/120pnns2'),
    ('Comedy', '/m/05p553'),
    ('Crime', '/m/0119mbcs'),
    ('Documentary', '/m/0jtdp'),
    ('Drama', '/g/11bwdpgj8t'),
    ('Family', '/g/1215clx1'),
    ('Fantasy', '/m/011869tv'),
    ('History', '/g/12290z2k'),
    ('Horror', '/m/03npn'),
    ('Music', '/m/04t36'),
    ('Mystery', '/m/01199x0y'),
    ('Romance', '/m/02l7c8'),
    ('Science Fiction', '/m/0119r056'),
    ('Thriller', '/g/122hp9x6'),
    ('TV Movie','/m/015w9s'),
    ('War', '/m/082gq'),
    ('Western', '/m/0hfjk');

-- Para conferir os 19 mids:
SELECT id, nome, termo_busca FROM pesquisa_mid ORDER BY id;