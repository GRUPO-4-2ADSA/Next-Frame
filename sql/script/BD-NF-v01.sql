CREATE DATABASE `nextframe`;
USE `nextframe` ;

CREATE TABLE `Empresa` (
  `idEmpresa` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NULL,
  `razao_social` VARCHAR(45) NULL,
  `cnpj` CHAR(14) NULL,
  PRIMARY KEY (`idEmpresa`));

CREATE TABLE `Usuario` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `Empresa_idEmpresa` INT NOT NULL,
  `nome` VARCHAR(45) NULL,
  `cargo` VARCHAR(45) NOT NULL,
  `cpf` CHAR(11) NULL,
  `dtNascimento` DATE NULL,
  `email` VARCHAR(45) NULL,
  `senha` VARCHAR(45) NULL,
  PRIMARY KEY (`idUsuario`),
  INDEX `fk_Usuario_Empresa_idx` (`Empresa_idEmpresa` ASC) VISIBLE,
  CONSTRAINT `fk_Usuario_Empresa`
    FOREIGN KEY (`Empresa_idEmpresa`)
    REFERENCES `mydb`.`Empresa` (`idEmpresa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `Projeto` (
  `idProjeto` INT NOT NULL AUTO_INCREMENT,
  `fkEmpresa` INT NOT NULL,
  `titulo` VARCHAR(45) NULL,
  `dtLancamento` DATE NULL,
  `orcamento` DECIMAL(11,2) NULL,
  `receita` DECIMAL(11,2) NULL,
  `genero` VARCHAR(45) NULL,
  `idioma_original` VARCHAR(30) NULL,
  `pais_de_producao` VARCHAR(30) NULL,
  `status` VARCHAR(15) NOT NULL,
  PRIMARY KEY (`idProjeto`),
  INDEX `fk_Projeto_Empresa1_idx` (`fkEmpresa` ASC) VISIBLE,
  CONSTRAINT `fk_Projeto_Empresa1`
    FOREIGN KEY (`fkEmpresa`)
    REFERENCES `mydb`.`Empresa` (`idEmpresa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `Log` (
  `idLog` INT NOT NULL,
  `fkUsuario` INT NOT NULL,
  `categoria` VARCHAR(45) NULL,
  `dtHora` DATE NULL,
  `acao` VARCHAR(45) NULL,
  PRIMARY KEY (`idLog`),
  INDEX `fk_Log_Usuario1_idx` (`fkUsuario` ASC) VISIBLE,
  CONSTRAINT `fk_Log_Usuario1`
    FOREIGN KEY (`fkUsuario`)
    REFERENCES `mydb`.`Usuario` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `Filme` (
  `idFilme` INT NOT NULL,
  `titulo` VARCHAR(45) NOT NULL,
  `orcamento` DECIMAL(11,2) NULL,
  `receita` DECIMAL(11,2) NULL,
  `roi` DECIMAL(11,2) NULL,
  `genero` VARCHAR(45) NULL,
  `idioma_original` VARCHAR(45) NULL,
  `pais_de_producao` VARCHAR(45) NULL,
  `popularidade` VARCHAR(45) NULL,
  `avaliacao_media` VARCHAR(45) NULL,
  `qtd_de_votos` INT NULL,
  `status` VARCHAR(45) NULL,
  `arq_origem` VARCHAR(45) NULL,
  PRIMARY KEY (`idFilme`));
