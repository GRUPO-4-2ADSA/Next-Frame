# PoC: interesse do público por gêneros de filmes (Google Trends)

Prova de conceito para coletar, no Google Trends, o interesse do público por gêneros de filmes e guardar os dados em um banco MySQL, prontos para serem consumidos por uma API e exibidos em dashboards.

> **Escopo deste README:** coleta (Python) e banco (MySQL). A API e a dashboard serão documentadas quando forem implementadas(assim espero).

## Sumário

- [Como funciona](#como-funciona)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como rodar o coletor](#como-rodar-o-coletor)
- [Como o coletor processa os dados](#como-o-coletor-processa-os-dados)
- [Banco de dados](#banco-de-dados)
- [Gêneros acompanhados](#gêneros-acompanhados)
- [Adicionar ou trocar um gênero](#adicionar-ou-trocar-um-gênero)
- [Conferindo os dados](#conferindo-os-dados)
- [Problemas comuns](#problemas-comuns)
- [Limitações conhecidas](#limitações-conhecidas)

## Como funciona

```
Google Trends → Coletor (Python) → MySQL
```

1. O **coletor** busca no Google Trends o interesse por 16 gêneros de filmes nos últimos 5 anos.
2. Ele trata os números (junta as buscas na mesma escala e agrupa por mês).
3. Grava o resultado no **MySQL**, nas tabelas `genero` e `interesse`.

O coletor roda de forma independente (manualmente, quando você quiser atualizar os dados). Quem for ler os dados depois consulta apenas o banco, sem depender do Google em tempo real.

### Por que a trendspyg

A biblioteca `pytrends` foi arquivada em 2025 e não funciona de forma confiável. Este projeto usa a [`trendspyg`](https://github.com/flack0x/trendspyg), uma alternativa gratuita e mantida. Ela abre o **Google Chrome** nos bastidores, então o Chrome precisa estar instalado e cada busca leva de 10 a 90 segundos.

Como o Google trends tem uma limitação de comparativo de 5 itens, ele faz varias buscas separadas para conseguir puxar todas as informações solicitadas

## Estrutura de pastas

```
poc-trends/
├── .gitignore
├── README.md
├── database/
│   └── trendspyg_v2.sql          # cria o banco, as tabelas e cadastra os gêneros
└── coletor/
    ├── coletor_interesse_generos.py   # busca no Google Trends e grava no banco
    ├── buscar_mids.py                 # ferramenta para descobrir o código (MID) de um gênero
    ├── requirements.txt               # bibliotecas do Python
    ├── .env.example                   # modelo das variáveis de ambiente
    ├── .env                           # suas credenciais (não vai para o GitHub)
    ├── venv/                          # ambiente virtual (não vai para o GitHub)
    └── bruto_grupo*.json              # respostas cruas do Google (geradas na coleta)
```

## Pré-requisitos

| Item | Observação |
|---|---|
| Python 3 | Testado com a versão 3.14. Marque **Add python.exe to PATH** na instalação (Windows). |
| MySQL | Servidor local rodando.  |
| Google Chrome | Usado pela trendspyg para buscar os dados. |

## Instalação

### 1. Criar o banco

Abra o `database/trendspyg_v2.sql` no MySQL Workbench (ou outro cliente) e execute o script inteiro.

> **Atenção:** o script **apaga e recria** as tabelas `genero` e `interesse`. Use na primeira instalação ou para recomeçar do zero.

Ao final, ele lista os gêneros cadastrados. Devem aparecer **16 linhas**.

### 2. Preparar o ambiente Python

No terminal, a partir da pasta `poc-trends`:

```
cd coletor
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

`python -m venv venv`
```
O que faz: Cria uma pasta isolada contendo uma cópia do Python e do gerenciador de pacotes (pip).

Por que usar: O primeiro venv chama o módulo do Python que constrói ambientes virtuais. O segundo venv é apenas o nome da pasta onde esses arquivos serão salvos (você poderia chamar de .venv ou meu_ambiente).
```

`venv\Scripts\activate`
```
O que faz: Ativa o ambiente virtual recém-criado no seu terminal (cmd ou PowerShell).

Como saber se funcionou: O nome do ambiente aparecerá entre parênteses no início da linha do terminal, assim: (venv) C:\seu-projeto>.

Por que usar: A partir do momento em que é ativado, qualquer pacote que você instalar usando o pip vai para dentro da pasta venv, sem interferir no Python global da sua máquina nem em outros projetos.
```

`pip install -r requirements.txt`
```
O que faz: Lê o arquivo de texto requirements.txt e instala todas as bibliotecas e versões listadas nele de uma só vez.

Por que usar: Evita ter que instalar pacote por pacote manualmente (ex: pip install pandas, pip install flask) e garante que seu projeto use exatamente as mesmas versões que o desenvolvedor original utilizou.
```

No Linux ou Mac, a ativação é `source venv/bin/activate`.

Quando o ambiente estiver ativo, o terminal mostra `(venv)` no começo da linha. É preciso ativar de novo a cada terminal novo.

### 3. Configurar as credenciais

Copie o modelo e preencha com os dados do seu MySQL:

```
copy .env.example .env
```

Edite o `.env`:

```
DB_HOST=localhost
DB_USER=Usuario_do_seu_banco
DB_SENHA=sua_senha_aqui
DB_NOME=poc_trends
```

- Sem espaços em volta do `=`.
- Se a senha tiver `#` ou espaços, coloque-a entre aspas: `DB_SENHA="minha#senha"`.
- O `.env` está no `.gitignore` e **nunca deve ser enviado ao GitHub**.

### 4. Testar a conexão com o banco

Este teste não faz nenhuma busca no Google:

```
python -c "import os, pymysql; from dotenv import load_dotenv; load_dotenv(); c = pymysql.connect(host=os.getenv('DB_HOST'), user=os.getenv('DB_USER'), password=os.getenv('DB_SENHA'), database=os.getenv('DB_NOME')); print('Conexão OK'); c.close()"
```

Se aparecer `Conexão OK`, está tudo pronto.

## Como rodar o coletor

Com o `(venv)` ativo e dentro da pasta `coletor`:

```
python coletor_interesse_generos.py
```

- São **4 buscas**, com 45 segundos de pausa entre elas. O Chrome abre sozinho: **não feche a janela**(As vezes ele roda em segundo plano).
- O processo leva de 5 a 10 minutos.
- No final, o terminal mostra `Linhas gravadas/atualizadas: 960`.
- Rodar de novo **atualiza** os valores existentes, sem duplicar.

**Rode uma vez e espere.** Se o Google bloquear (erro `RateLimitError`), pare e aguarde antes de tentar novamente.

### Configurações

No topo do `coletor_interesse_generos.py`:

| Variável | Padrão | O que faz |
|---|---|---|
| `GEO` | `"BR"` | País da coleta. Use `""` para o mundo todo (gravado como `WW`). |
| `TIMEFRAME` | `"today 5-y"` | Período buscado (últimos 5 anos). |
| `CATEGORY` | `0` | Categoria do Google Trends (0 = sem filtro, 34 = Filmes). |
| `ANCORA` | `"Terror"` | Gênero que entra em todas as buscas (explicado abaixo). |
| `PAUSA` | `45` | Segundos de espera entre uma busca e outra. |

## Como o coletor processa os dados

1. **Lê os gêneros** da tabela `genero`.
2. **Divide em grupos.** O Google compara no máximo 5 termos por busca. Com 16 gêneros, o coletor faz 4 buscas, e o gênero âncora (Terror) entra em **todas**.
3. **Busca os últimos 5 anos.** O Google devolve esse período por **semana**. A semana ainda incompleta é descartada.
4. **Junta tudo na mesma escala.** Cada busca tem a própria escala de 0 a 100. Como a âncora aparece em todas, o coletor usa a média dela para multiplicar cada busca por um fator e igualar as escalas.
5. **Agrupa por mês.** Tira a média das semanas de cada mês e ignora meses com menos de 4 semanas (meses incompletos nas pontas).
6. **Reescala** para que o maior valor de todos seja 100.
7. **Grava no MySQL**, com `INSERT ... ON DUPLICATE KEY UPDATE`.

Resultado: 60 meses × 16 gêneros = **960 linhas**.

A resposta crua de cada busca é salva em `bruto_grupo1.json` a `bruto_grupo4.json`, na pasta de onde o coletor foi executado. Assim, é possível refazer contas sem buscar de novo no Google.

## Banco de dados

Banco: `poc_trends`. Script de criação: [`database/trendspyg_v2.sql`](database/trendspyg_v2.sql).

```
genero (1) ──────< interesse (N)
  id  ◄──────────── fk_genero
```

Um gênero tem várias linhas de interesse, uma por mês.

### Tabela `genero`

Cadastro dos gêneros acompanhados.

| Coluna | Tipo | O que guarda |
|---|---|---|
| `id` | INT, chave primária, auto incremento | Identificador do gênero |
| `nome` | VARCHAR(50), único | Nome de exibição (ex.: Terror) |
| `termo_busca` | VARCHAR(100), único | O que é enviado ao Google: um código de tópico (MID, ex.: `/m/03npn`) ou, quando não há tópico, um texto (ex.: `drama movie`) |

Um **MID** identifica um *assunto*, e não uma palavra. Por isso a busca por tópico funciona em qualquer idioma, ao contrário de um texto como "filme de terror", que só captura quem digita em português.

### Tabela `interesse`

Série temporal: uma linha por gênero por mês.

| Coluna | Tipo | O que guarda |
|---|---|---|
| `id` | INT, chave primária, auto incremento | Identificador da linha |
| `fk_genero` | INT, chave estrangeira | Gênero a que a linha pertence (`genero.id`) |
| `data_ref` | DATE | **Mês** de referência, sempre o dia 1 (ex.: `2026-09-01`). É a média das semanas daquele mês. |
| `valor` | DECIMAL(6,2) | Interesse **relativo**, de 0 a 100, na mesma escala para todos os gêneros |
| `geo` | VARCHAR(5), padrão `BR` | Região da coleta: `BR` (Brasil) ou `WW` (worldwide, mundo todo) |
| `coletado_em` | DATETIME, padrão agora | Quando o coletor gravou a linha (preenchido pelo banco) |

Regras da tabela:

- A combinação `fk_genero + data_ref + geo` é **única**. Por isso, rodar o coletor de novo atualiza os valores em vez de duplicar.
- `WW` é uma convenção deste projeto. O Google representa o mundo todo com texto vazio.

Exemplo de linha:

| id | fk_genero | data_ref | valor | geo | coletado_em |
|---|---|---|---|---|---|
| 1 | 1 (Terror) | 2026-09-01 | 78.50 | BR | 2026-10-14 21:30:00 |

### O que significa o `valor`

O Google Trends não informa o número real de buscas. O valor 100 é o maior interesse de todos os gêneros em todo o período, e os demais são proporcionais a ele. Um gênero com valor 50 teve metade do interesse do pico.

## Gêneros acompanhados

| Gênero | `termo_busca` | Observação |
|---|---|---|
| Terror | `/m/03npn` | Âncora das buscas |
| Ação | `/m/02kdv5l` | |
| Aventura | `/m/03k9fj` | |
| Comédia | `/m/05p553` | |
| Ficção Científica | `/m/0119r056` | |
| Animação | `/g/120pnns2` | |
| Suspense | `/g/122hp9x6` | |
| Super-herói | `/m/04pbhw` |   |
| Fantasia | `/m/011869tv` | |
| Crime | `/m/0119mbcs` | |
| Família | `/g/1215clx1` | |
| Musical | `/m/04t36` | |
| Guerra | `/m/082gq` | |
| Documentário | `/m/0jtdp` | Tópico genérico "Documentary" |
| Romance | `/m/02l7c8` | Tópico genérico, menos confiável (pode incluir romance de livro e de relacionamento) |
| Drama | `drama movie` | Texto, pois não há tópico de gênero de filme; menos confiável |

## Adicionar ou trocar um gênero

1. Descubra o código do gênero com a ferramenta de apoio. Edite o dicionário `GENEROS` do `buscar_mids.py` (nome do gênero e a busca em inglês) e rode:

   ```
   python buscar_mids.py
   ```

   O script lista, para cada gênero, os candidatos do tipo "gênero" (ex.: `/m/03npn | Horror | Film genre`). Escolha o que for **gênero de filme** e desconfie de códigos que não vieram desta lista: um MID errado não gera erro, apenas aponta para outro assunto.

2. Cadastre no banco:

   ```sql
   INSERT INTO genero (nome, termo_busca) VALUES ('Nome do gênero', '/m/xxxxx');
   ```

3. Rode o coletor de novo. Ele detecta o novo gênero e ajusta o número de buscas. Como a escala é recalculada a cada coleta, todos os valores são atualizados.

## Conferindo os dados

Quantos meses cada gênero tem, a média e o pico:

```sql
SELECT g.nome, COUNT(*) AS meses, ROUND(AVG(i.valor), 1) AS media, MAX(i.valor) AS pico
FROM poc_trends.interesse i
JOIN poc_trends.genero g ON g.id = i.fk_genero
GROUP BY g.nome
ORDER BY media DESC;
```

Esperado: todos os gêneros com **60 meses** e o maior `pico` da tabela igual a **100**.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `RateLimitError` | O Google bloqueou temporariamente. Pare e espere antes de tentar de novo. |
| `ATENÇÃO: os nomes devolvidos são diferentes dos enviados` | O coletor parou antes de gravar. O Google devolveu os termos com outro nome. Veja os arquivos `bruto_grupo*.json`. |
| `Access denied for user` | Usuário ou senha errados no `.env`. |
| `Can't connect to MySQL server` | O MySQL não está rodando. |
| `No module named ...` | O `(venv)` não está ativo ou as bibliotecas não foram instaladas (`pip install -r requirements.txt`). |
| `can't open file ... No such file` | O terminal está na pasta errada. Entre em `coletor` com `cd coletor`. |
| `Fatal error in launcher` ao usar o `pip` | O `venv` foi movido de pasta e quebrou. Apague a pasta `venv` e crie de novo (passo 2 da instalação). |

## Limitações conhecidas

- Os valores são **relativos** (0 a 100), e não o volume real de buscas.
- **Romance** e **Drama** são os gêneros menos confiáveis, porque não têm um tópico de gênero de filme no Google.
- Os gêneros de cinema não são mutuamente exclusivos (um mesmo filme pode ser de ação e de aventura, por exemplo). Os valores de cada gênero devem ser lidos de forma independente, sem somar um com o outro.
- A `trendspyg` não é uma biblioteca oficial do Google. Ela depende do Chrome e pode deixar de funcionar se o Google mudar o site.
- A coleta é lenta e limitada pelo Google, então os dados são atualizados em lote, e não em tempo real.
- A categoria 34 (Filmes) não é usada por padrão.
- A escala entre as 4 buscas é ajustada por uma âncora (Terror), o que é uma aproximação.
