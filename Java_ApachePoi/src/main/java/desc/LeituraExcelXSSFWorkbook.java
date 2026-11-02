package desc;

import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.Filme;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class LeituraExcelXSSFWorkbook {

    public List<Filme> extracaoFilmes(String caminhoArquivo) {

        List<Filme> filmesExtraidos = new ArrayList<>();

        try (
                InputStream input = new FileInputStream(caminhoArquivo);
                Workbook workbook = new XSSFWorkbook(input);
        ) {
            System.out.printf("Iniciando leitura do arquivo %s%n", caminhoArquivo);

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {

                if (row.getRowNum() == 0) {
                    continue;
                }

                if (row.getCell(1) == null || row.getCell(1).getCellType() == CellType.BLANK ||
                        row.getCell(5) == null || row.getCell(5).getCellType() == CellType.BLANK ||
                        row.getCell(6) == null || row.getCell(6).getCellType() != CellType.NUMERIC ||
                        row.getCell(6).getNumericCellValue() == 0.0 ||
                        row.getCell(8) == null || row.getCell(8).getCellType() != CellType.NUMERIC ||
                        row.getCell(8).getNumericCellValue() == 0.0 ||
                        row.getCell(14) == null || row.getCell(14).getCellType() == CellType.BLANK) {
                    continue;
                }

                String titulo = row.getCell(1).getStringCellValue();
                LocalDate dataLanc = row.getCell(5).getLocalDateTimeCellValue().toLocalDate();
                Double receita = row.getCell(6).getNumericCellValue();
                Double orcamento = row.getCell(8).getNumericCellValue();
                String idioma = row.getCell(10).getStringCellValue();
                String generos = row.getCell(14).getStringCellValue();
                String produtoras = row.getCell(15).getStringCellValue();
                String descricao = "Teste";

                Integer roi = (int) (((receita - orcamento) / orcamento) * 100);

                Filme filme = new Filme(
                        titulo,
                        generos,
                        orcamento,
                        receita,
                        roi,
                        descricao,
                        produtoras,
                        idioma,
                        dataLanc
                );

                filmesExtraidos.add(filme);
            }

            return filmesExtraidos;

        } catch (IOException e) {
            return null;
        }
    }
}