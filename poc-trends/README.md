# PoC: interesse do público por gêneros de filmes (Google Trends)

Prova de conceito que coleta, no Google Trends, o interesse do público por 19 gêneros de filmes nos últimos 5 anos, grava os dados num JSON e num banco MySQL, e (nas próximas etapas) expõe tudo numa API em Node.js para uma dashboard.

```
Google Trends ──► coletor (Python) ──► JSON (histórico) ──► MySQL ──► API Node.js ──► Dashboard
                                                                      (a fazer)       (a fazer)
```

**Estado atual:** coletor, banco e busca de MIDs prontos. API e dashboard ainda não foram feitas.

---

## Sumário

1. [Como rodar tudo (passo a passo)](#como-rodar-tudo-passo-a-passo)
2. [Estrutura do projeto](#estrutura-do-projeto)
3. [Banco de dados](#banco-de-dados)
4. [Como o coletor funciona](#como-o-coletor-funciona)
5. [Configurações do coletor](#configurações-do-coletor)
6. [Descobrindo os MIDs (`buscar_mids.py`)](#descobrindo-os-mids-buscar_midspy)
7. [Rotina de atualização](#rotina-de-atualização)
8. [Problemas comuns](#problemas-comuns)
9. [Limitações conhecidas](#limitações-conhecidas)
10. [Próximos passos](#próximos-passos)

---

## Como rodar tudo (passo a passo)

### Pré-requisitos

- **Python 3** instalado (confira com `python --version`)
- **MySQL** instalado e rodando (Server + Workbench ou cliente de linha de comando)
- **Git** (para clonar o repositório)

### 1. Abrir o projeto

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
```

No VS Code: abra a pasta do projeto e use *Terminal > New Terminal*. Todos os comandos abaixo são rodados **dentro da pasta do projeto**.

### 2. Criar o ambiente virtual

```bash
python -m venv venv
```

(Se `python` não for reconhecido no Windows, use `py -m venv venv`.)

### 3. Ativar o ambiente virtual

| Sistema | Comando |
|---|---|
| Windows (PowerShell / terminal do VS Code) | `venv\Scripts\activate` |
| Windows (cmd) | `venv\Scripts\activate.bat` |
| Linux / Mac | `source venv/bin/activate` |

Quando ativar, aparece `(venv)` no começo da linha do terminal. **A cada terminal novo, ative de novo.** Para sair: `deactivate`.

> Se o PowerShell reclamar de "execução de scripts desabilitada", rode uma vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 4. Instalar as dependências

```bash
pip install -r requirements.txt
```

Bibliotecas usadas: `trendspyg` (Google Trends), `PyMySQL` (conexão com o MySQL) e `python-dotenv` (leitura do `.env`). Para conferir: `pip list`.

### 5. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` (sem `.txt` no final):

```
DB_HOST=localhost
DB_USER=root
DB_SENHA=sua_senha
DB_NOME=nextframe_trendspyg
```

O `DB_NOME` precisa ser o mesmo nome do banco criado pelo script SQL. O `.env` **não** deve ir para o GitHub (veja o [`.gitignore`](#gitignore-sugerido)).

### 6. Criar o banco de dados

Rode o script `database/script_v3.sql` no MySQL. Duas opções:

- **MySQL Workbench:** *File > Open SQL Script*, escolha o arquivo e execute tudo (ícone do raio).
- **Linha de comando** (funciona em PowerShell, cmd e Linux/Mac):

  ```bash
  mysql -u root -p -e "source database/script_v3.sql"
  ```

> **Atenção:** o script começa com `DROP DATABASE IF EXISTS nextframe_trendspyg`, ou seja, **apaga o banco e recria tudo**. Não rode se existir um banco com esse nome e dados que você queira manter.

O `SELECT` do final do script deve listar os **19 gêneros** com o `termo_busca` preenchido.

### 7. Testar a conexão com o banco

Com o ambiente virtual ativado, direto na linha de comando:

```bash
python -c "import os, pymysql; from dotenv import load_dotenv; load_dotenv(); c = pymysql.connect(host=os.getenv('DB_HOST','localhost'), user=os.getenv('DB_USER','root'), password=os.getenv('DB_SENHA',''), database=os.getenv('DB_NOME')); cur = c.cursor(); cur.execute('SELECT COUNT(*) FROM pesquisa_mid'); print('Conexao OK! Generos:', cur.fetchone()[0]); c.close()"
```

Resultado esperado: `Conexao OK! Generos: 19`.

### 8. Rodar o coletor

```bash
python coletor_interesse_generos.py
```

Na **primeira vez** ele faz a coleta completa de 5 anos: são **5 buscas no Google com pausas entre elas**, e leva cerca de 5 a 6 minutos. Acompanhe o terminal; ao final aparece `Linhas gravadas/atualizadas no banco: N`.

### 9. Conferir o resultado

No MySQL:

```sql
SELECT g.nome, COUNT(*) AS meses
FROM interesse i
JOIN pesquisa_mid g ON g.id = i.fk_genero
GROUP BY g.nome
ORDER BY g.nome;
```

Devem aparecer os 19 gêneros, todos com a mesma quantidade de meses (cerca de 58 a 60).

### Resumo (para quem já configurou tudo uma vez)

```bash
venv\Scripts\activate                      # ativar o ambiente (Linux/Mac: source venv/bin/activate)
python coletor_interesse_generos.py        # coletar / atualizar
```

---

## Estrutura do projeto

```
.
├── coletor_interesse_generos.py   # coleta no Google Trends, guarda no JSON e grava no MySQL
├── buscar_mids.py                 # ajuda a descobrir o MID de cada gênero (uso eventual)
├── database/
│   └── script_v3.sql              # cria o banco, as tabelas e os 19 gêneros
├── requirements.txt               # dependências Python
├── .env                           # credenciais do banco (NÃO versionar)
├── .gitignore
│
│   # arquivos gerados pelos scripts:
├── dados_interesse_WW.json        # histórico mensal de todos os gêneros (fonte da verdade)
├── mids_encontrados.json          # candidatos de MID devolvidos pelo Google (cache do buscar_mids)
└── bruto_WW_<modo>_grupoN.json    # resposta crua de cada busca (só para retomar execuções)
```

### `.gitignore` sugerido

```
.env
venv/
__pycache__/
bruto_*.json
*.tmp
*.bak
```

O `dados_interesse_WW.json` pode ser versionado: ele é o histórico acumulado e evita gastar requisições ao Google para reconstruir os dados em outra máquina.

---

## Banco de dados

Banco: `nextframe_trendspyg`

**`pesquisa_mid`**: os gêneros e o termo usado na busca

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT, PK, auto incremento | |
| `nome` | VARCHAR(50), único | nome do gênero (ex.: `Horror`) |
| `termo_busca` | VARCHAR(100) | MID do Google Trends (ex.: `/m/03npn`) |

**`interesse`**: o interesse mensal de cada gênero

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT, PK, auto incremento | |
| `fk_genero` | INT, FK → `pesquisa_mid.id` | |
| `data_ref` | DATE | sempre o dia 1 do mês (ex.: `2026-10-01`) |
| `valor` | DECIMAL(6,2) | interesse relativo (escala de 0 a 100, veja [limitações](#limitações-conhecidas)) |
| `geo` | VARCHAR(5) | `WW` (mundo todo) ou `BR` |
| `coletado_em` | DATETIME | quando a linha foi gravada/atualizada |

A restrição `UNIQUE (fk_genero, data_ref, geo)` garante um valor por gênero, por mês, por região, e é o que permite ao coletor rodar de novo sem duplicar linhas (`ON DUPLICATE KEY UPDATE`).

### Os 19 gêneros e seus MIDs

| Gênero | MID | Gênero | MID |
|---|---|---|---|
| Action | `/m/02kdv5l` | History | `/g/12290z2k` |
| Adventure | `/m/03k9fj` | Horror | `/m/03npn` |
| Animation | `/g/120pnns2` | Music | `/m/04t36` |
| Comedy | `/m/05p553` | Mystery | `/m/01199x0y` |
| Crime | `/m/0119mbcs` | Romance | `/m/02l7c8` |
| Documentary | `/m/0jtdp` | Science Fiction | `/m/0119r056` |
| Drama | `/g/11bwdpgj8t` | Thriller | `/g/122hp9x6` |
| Family | `/g/1215clx1` | TV Movie | `/m/015w9s` |
| Fantasy | `/m/011869tv` | War | `/m/082gq` |
| | | Western | `/m/0hfjk` |

Todas as buscas usam a categoria **Filmes** (`CATEGORY = 34`), o que restringe os tópicos ao cinema (inclusive os de Drama e TV Movie, que o Trends mostra como "cinema e televisão"/gênero televisivo).

---

## Como o coletor funciona

### Visão geral

1. Lê os 19 gêneros da tabela `pesquisa_mid`.
2. Decide o que precisa buscar, olhando o JSON `dados_interesse_WW.json` (veja os 3 modos abaixo).
3. Se precisar, faz as buscas no Google Trends, coloca todos os gêneros na mesma escala e calcula a média mensal.
4. Guarda o resultado no JSON.
5. Grava no MySQL **a partir do JSON** (em toda execução, sem gastar requisição ao Google).

### Os 3 modos

| Modo | Quando acontece | Requisições ao Google |
|---|---|---|
| **completo** | não existe JSON, ou mudou o `GEO`, a âncora, algum gênero ou algum MID | 5 (busca 5 anos) |
| **atualizar** | falta pelo menos um mês fechado no JSON | 5 (busca 12 meses e acrescenta só o que falta) |
| **em_dia** | o JSON já tem o último mês fechado de todos os gêneros | **0** |

Na prática: **5 requisições por mês e nenhuma nos outros dias.** No modo completo, o JSON antigo é copiado para `.bak` antes de ser refeito.

### Por que o modo "atualizar" busca 12 meses e não só o mês novo

O Google comparar até **5 termos por busca** significa que atualizar 19 gêneros sempre custa 5 requisições, não importa o período. Além disso, **cada busca tem escala própria** (o maior valor da busca vira 100), então um mês buscado sozinho não seria comparável ao histórico.

Por isso a atualização pede os últimos 12 meses, compara os meses em comum com o que já está salvo, calcula um fator de escala e **acrescenta apenas os meses que ainda não existem**. O histórico antigo nunca é alterado.

### Âncora (Thriller) e grupos por tamanho

O Google só compara 5 termos por busca. O gênero **Thriller** entra em todas as buscas como âncora, e os outros 18 se dividem em grupos de 4.

A âncora é de **porte médio** de propósito: um gênero gigante (como o Horror) viraria 100 em toda busca e comprimiria os pequenos para perto de zero, com valores arredondados para 0 ou 1. O Thriller é grande o bastante para medir a escala e não esmaga os demais.

Os grupos são montados **por tamanho de interesse**: gêneros grandes juntos e pequenos juntos, usando a lista `ORDEM_TAMANHO` do coletor.

| Busca | Termos |
|---|---|
| 1 | Thriller, Horror, Documentary, Comedy, Action |
| 2 | Thriller, Romance, Animation, War, Western |
| 3 | Thriller, Science Fiction, Drama, Adventure, Crime |
| 4 | Thriller, Mystery, Fantasy, TV Movie, Music |
| 5 | Thriller, History, Family |

Como o Thriller aparece em todas, a média dele em cada busca mostra a diferença de escala entre elas. O coletor multiplica os valores de cada busca por um fator (`média do Thriller na busca 1 ÷ média do Thriller na busca N`) para colocar todos os gêneros na mesma régua. Na coleta completa, no final, tudo é reescalado para que o maior valor seja 100.

### Semanas viram meses (só meses fechados)

O Google devolve dados **por semana**. O coletor:

1. descarta a semana que ainda não terminou;
2. agrupa as semanas por mês e faz a média;
3. só guarda meses com **pelo menos 4 semanas** e **anteriores ao mês atual**. Se o mês não fechou, as semanas dele são descartadas.

Assim, um valor gravado nunca precisa ser corrigido depois.

### Proteção contra bloqueio do Google

- Pausa de **60s + 0 a 15s sorteados** entre uma busca e outra.
- Em caso de erro, tenta até **4 vezes**, esperando 120s, 240s, 360s...
- Se as tentativas acabarem, o script **para sem gravar nada** e avisa; basta rodar de novo mais tarde.
- Cada busca bem-sucedida é guardada em `bruto_WW_<modo>_grupoN.json`. Se uma execução falhar no meio, ao rodar de novo as buscas que já deram certo (com menos de 24h) são reaproveitadas, sem nova requisição.
- Há uma trava de segurança: se o Google devolver nomes de termos diferentes dos enviados, o script para antes de gravar.

### Formato do `dados_interesse_WW.json`

```json
{
  "meta": { "geo": "WW", "ancora": "Thriller", "ultima_consulta": "2026-11-21" },
  "generos": {
    "Horror": {
      "termo": "/m/03npn",
      "meses": { "2021-12": 41.3, "2022-01": 44.8 }
    }
  }
}
```

---

## Configurações do coletor

Ficam no topo do `coletor_interesse_generos.py`:

| Variável | Valor atual | Para que serve |
|---|---|---|
| `GEO` | `""` | `""` = mundo todo (gravado como `WW`), `"BR"` = Brasil |
| `TIMEFRAME_COMPLETO` | `"today 5-y"` | janela da primeira coleta |
| `TIMEFRAME_ATUALIZAR` | `"today 12-m"` | janela das atualizações (precisa se sobrepor ao histórico) |
| `CATEGORY` | `34` | categoria Filmes (`0` = sem filtro) |
| `ANCORA` | `"Thriller"` | gênero presente em todas as buscas, de porte médio (nome igual ao da tabela `pesquisa_mid`) |
| `ORDEM_TAMANHO` | lista de 19 gêneros | ordem do maior para o menor interesse, usada para montar os grupos de busca |
| `PAUSA` / `PAUSA_EXTRA` | `60` / `15` | espera entre buscas (segundos) |
| `PAUSA_ERRO` | `120` | espera base após um erro (multiplicada pela tentativa) |
| `TENTATIVAS` | `4` | tentativas por busca antes de desistir |
| `CACHE_HORAS` | `24` | validade dos arquivos `bruto_*` usados para retomar execuções |

> Trocar o `GEO` muda o nome do arquivo de dados (`dados_interesse_BR.json`) e o valor gravado na coluna `geo`, então os dados de Brasil e de mundo ficam separados.

---

## Descobrindo os MIDs (`buscar_mids.py`)

Script de uso eventual, para achar o **MID** (identificador de tópico do Google Trends) de cada gênero.

```bash
python buscar_mids.py
```

- Pesquisa o texto de cada gênero (ex.: `Horror film`) e guarda **todas as sugestões** do Google no `mids_encontrados.json`.
- No terminal mostra só os candidatos cujo tipo contém "genre" (ex.: *Film genre*).
- Tem pausa de 20s entre buscas, 3 tentativas em caso de erro e **cache**: gêneros já buscados (com o mesmo texto de busca) não são consultados de novo.
- Quando o script não acha candidato de gênero (acontece com alguns), o MID pode ser pego manualmente no site do Trends: pesquise o termo com a categoria **Filmes**, escolha o tópico e copie o valor do parâmetro `q=` da URL (`%2F` vira `/`).

O `buscar_mids.py` é só para **descobrir** MIDs. O que o coletor usa é a coluna `termo_busca` da tabela `pesquisa_mid`, definida no `script_v3.sql`.

---

## Rotina de atualização

1. Uma vez por mês (ou quando quiser), com o ambiente ativado: `python coletor_interesse_generos.py`.
2. Se o mês anterior já estiver no JSON, ele avisa que está em dia, faz **0 requisições** e só reenvia o JSON ao banco.
3. Se faltar um mês fechado, ele faz 5 buscas e acrescenta o mês novo.

Se o banco for recriado com o `script_v3.sql`, basta rodar o coletor: ele repõe tudo a partir do JSON, sem ir ao Google.

---

## Problemas comuns

| Mensagem / sintoma | Causa provável |
|---|---|
| `ModuleNotFoundError: No module named ...` | ambiente virtual não ativado, ou `pip install -r requirements.txt` não foi rodado |
| `Access denied for user` | usuário ou senha errados no `.env` |
| `Unknown database` | o `script_v3.sql` não foi rodado, ou o `DB_NOME` do `.env` está diferente do banco |
| `Can't connect to MySQL server` | MySQL parado, ou `DB_HOST` errado |
| `Table ... doesn't exist` | o banco existe, mas as tabelas não foram criadas |
| Conexão volta sem dados / variáveis `None` | o `.env` não está sendo lido: confira o nome do arquivo (sem `.txt`) e se está na pasta de onde você roda o comando |
| `O Google não respondeu depois de várias tentativas` | bloqueio temporário por excesso de buscas; rode de novo mais tarde (o que já deu certo fica salvo) |
| `ATENÇÃO: os nomes devolvidos são diferentes dos enviados` | trava de segurança: o Google devolveu termos diferentes dos enviados; nada foi gravado |
| `A âncora veio com média 0` | o Thriller veio zerado numa busca; não dá para ajustar a escala |
| `Não há meses em comum...` | na atualização, o histórico e a busca nova não têm meses em comum; apague `dados_interesse_WW.json` para refazer a coleta completa |
| `KeyError` / `StopIteration` ao buscar a âncora | o nome em `ANCORA` não existe na tabela `pesquisa_mid` (confira maiúsculas) |

---

## Limitações conhecidas

- **Janela móvel de 5 anos:** o Google devolve os últimos 5 anos a partir da data da coleta, então as pontas não vêm com anos completos. Numa coleta em novembro de 2026, por exemplo, 2021 traz só dezembro e 2026 vai até outubro. O ano corrente se completa mês a mês.
- **Valores relativos, não absolutos:** o Trends mostra interesse relativo, não número de buscas.
- **Meses novos são ajustados à escala do histórico:** eles entram por um fator calculado com os meses em comum, e não medidos na mesma régua dos 5 anos. Um mês novo que seja um pico pode passar de 100 (a coluna `valor` comporta isso), então o eixo dos gráficos não deve ser fixado em 100.
- **Âncora:** o Thriller precisa ter interesse estável e sem zeros nas buscas, senão não dá para ajustar a escala.
- **Gêneros pequenos têm pouca resolução:** o Google devolve valores inteiros e cada busca tem escala própria, então gêneros com interesse muito baixo (como Family e History) variam em poucos degraus e podem aparecer com valores repetidos ou zero. A comparação entre eles é menos confiável que entre os gêneros grandes.
- **Dados mundiais (`WW`):** a coleta atual é do mundo todo, não só do Brasil.

---

## Próximos passos

- [ ] API em Node.js/Express (padrão MVC) lendo do MySQL:
  - rota do **gráfico 01**: top 5 gêneros + o gênero escolhido pelo usuário;
  - rota do **gráfico 02**: o gênero escolhido, com uma linha por ano.
- [ ] Dashboard (JS/HTML/CSS) com os dois gráficos e um campo de seleção de gênero (datalist) que preenche um campo oculto com o MID.
- [ ] Complementar este README com a API e a dashboard.
