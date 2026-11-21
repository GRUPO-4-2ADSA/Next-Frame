import json  # Para ler e escrever arquivos no formato JSON (nossa base local permanente)
import os  # Para interagir com o sistema operacional (verificar arquivos, variáveis de ambiente, renomear)
import random  # Para gerar números aleatórios (usado para variar o tempo de espera entre requisições)
import shutil  # Para copiar arquivos de forma segura (usado para criar backup .bak)
import time  # Para pausar a execução (sleep) e verificar a idade dos arquivos de cache
from collections import defaultdict  # Cria dicionários que já inicializam valores padrão (ex: listas vazias)
from datetime import date, timedelta  # Para manipular datas e calcular o mês anterior fechado

import pymysql  # Driver para conectar e executar comandos SQL no banco de dados MySQL
from dotenv import load_dotenv  # Carrega variáveis sensíveis (senhas, host) de um arquivo .env oculto
from trendspyg import download_google_trends_comparison  # Biblioteca que faz a raspagem/consulta no Google Trends


# CONFIGURAÇÕES E CONSTANTES GLOBAIS
load_dotenv()  # Lê o arquivo .env na raiz do projeto e injeta as variáveis no ambiente do sistema

# Lê as credenciais do banco do ambiente; se não encontrar, usa o segundo valor como padrão
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_SENHA = os.getenv("DB_SENHA", "")
DB_NOME = os.getenv("DB_NOME", "nextframe_trendspyg")

GEO = ""                            # Código do país ("BR" para Brasil, "" vazio para o mundo todo)
TIMEFRAME_COMPLETO = "today 5-y"    # Janela de tempo da 1ª coleta: vai buscar de hoje até os últimos 5 anos
TIMEFRAME_ATUALIZAR = "today 12-m"  # Janela de atualização: vai buscar de hoje até os últimos 12 meses (para pegar meses novos com sobreposição)
CATEGORY = 34                       # Código de categoria do Google Trends (34 = Filmes/Movies; 0 = Todas)
ANCORA = "Horror"                   # Termo fixo que entrará em TODAS as buscas para servir de régua de escala

# --- Parâmetros de proteção contra bloqueio (Rate Limit / Erro 429 do Google) ---
PAUSA = 60         # Tempo base de espera (em segundos) entre uma consulta e outra
PAUSA_EXTRA = 15   # Tempo aleatório adicional (0 a 15s) para não parecer um robô com intervalo fixo
PAUSA_ERRO = 120   # Tempo base de espera caso o Google bloqueie/falhe (aumenta a cada tentativa)
TENTATIVAS = 4     # Número máximo de tentativas para uma mesma busca antes de abortar o script
CACHE_HORAS = 24   # Validade (em horas) dos arquivos temporários brutos caso o script precise ser reiniciado

# Se GEO for vazio (""), define a sigla "WW" (WorldWide) para salvar no banco e nos nomes de arquivos
GEO_GRAVAR = GEO or "WW"

# Nome do arquivo JSON definitivo que guardará o histórico consolidado
ARQUIVO_DADOS = f"dados_interesse_{GEO_GRAVAR}.json"

# --- Controle de Datas ---
HOJE = date.today()  # Pega a data atual do sistema (ex: 2026-11-20)
MES_ATUAL = HOJE.strftime("%Y-%m")  # Formata apenas ano e mês atuais (ex: "2026-11")
# Pega o dia da variavel hoje, substitui o dia por 1, depois tira 1 dia pra ele cair no mês anterior e por ultimo formata a data para ano e mês
ULTIMO_FECHADO = (HOJE.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")


# FUNÇÕES AUXILIARES
def carregar_dados():
    """Lê o arquivo JSON consolidado se ele já existir no disco."""
    if os.path.exists(ARQUIVO_DADOS):  # Verifica se o arquivo existe na pasta
        with open(ARQUIVO_DADOS, "r", encoding="utf-8") as f:  # Abre em modo leitura com suporte
            return json.load(f)  # Converte o texto JSON em um dicionário Python e retorna
    return None  # Retorna None caso seja a primeira vez rodando o script


def salvar_dados(dados):
    """Grava em um arquivo temporário primeiro para não perder os dados caso o script trave no meio."""
    for g in dados["generos"].values():  # Percorre cada gênero dentro do dicionário
        # Ordena cronologicamente as chaves dos meses ("2021-01", "2021-02"...) para o arquivo ficar organizado
        g["meses"] = dict(sorted(g["meses"].items()))

    # Escreve primeiro em um arquivo temporário (.tmp)
    with open(ARQUIVO_DADOS + ".tmp", "w", encoding="utf-8") as f:
        # ensure_ascii=False mantém acentos legíveis; indent=2 formata com recuo de 2 espaços
        json.dump(dados, f, ensure_ascii=False, indent=2)

    # Substitui o arquivo oficial pelo temporário instantaneamente no sistema de arquivos
    os.replace(ARQUIVO_DADOS + ".tmp", ARQUIVO_DADOS)


def decidir_modo(dados, generos):
    """Define a estratégia de execução: 'completo', 'atualizar' ou 'em_dia'."""
    if dados is None:  # Se não existe arquivo histórico salvo...
        return "completo"  # ...precisa baixar tudo do zero (5 anos)

    meta = dados.get("meta", {})  # Pega os metadados da última execução
    # Se mudou o país (GEO) ou o termo âncora, a escala antiga não serve mais -> refaz tudo
    if meta.get("geo") != GEO_GRAVAR or meta.get("ancora") != ANCORA:
        return "completo"

    ultimos = []  # Lista para guardar qual é o último mês salvo de cada gênero
    for _, nome, termo in generos:  # Percorre os gêneros vindos do banco de dados
        g = dados.get("generos", {}).get(nome)  # Busca esse gênero no JSON salvo
        # Se entrou um gênero novo no banco, ou mudou o termo de busca, ou está vazio -> refaz tudo
        if g is None or g["termo"] != termo or not g["meses"]:
            return "completo"
        ultimos.append(max(g["meses"]))  # Pega o mês mais recente salvo para este gênero

    # Se o gênero mais atrasado já tem o último mês fechado (ex: mês passado), está tudo atualizado
    if min(ultimos) >= ULTIMO_FECHADO:
        return "em_dia"

    # Se já rodou hoje e o Google ainda não liberou os dados fechados do mês passado, evita repetir à toa
    if meta.get("ultima_consulta") == str(HOJE):
        return "em_dia"

    # Caso contrário, o histórico está íntegro, mas falta(m) mês(es) recente(s) -> atualização incremental
    return "atualizar"


def arquivo_cache(modo, n):
    """Gera o nome do arquivo de cache bruto para o lote 'n' (ex: bruto_WW_completo_grupo1.json)."""
    return f"bruto_{GEO_GRAVAR}_{modo}_grupo{n}.json"


def so_pontos_fechados(env):
    """Filtra a resposta do Google removendo a semana atual em andamento (is_partial == True)."""
    return [p for p in env["interest_over_time"] if not p["is_partial"]]


def ler_cache(modo, n, grupo):
    """Verifica se já temos a resposta desse lote salva recentemente no disco para não gastar requisição."""
    caminho = arquivo_cache(modo, n)  # Monta o nome do arquivo esperado
    if not os.path.exists(caminho):  # Se o arquivo de cache não existe, retorna None
        return None

    # Calcula há quantas horas o arquivo foi modificado pela última vez
    idade_horas = (time.time() - os.path.getmtime(caminho)) / 3600
    if idade_horas > CACHE_HORAS:  # Se passou de 24h, o cache expirou
        return None

    with open(caminho, "r", encoding="utf-8") as f:  # Abre o arquivo de cache
        env = json.load(f)

    pontos = so_pontos_fechados(env)  # Filtra apenas semanas completas
    # Valida se os termos dentro do cache são exatamente os mesmos do grupo atual
    if not pontos or set(pontos[0]["values"].keys()) != set(grupo):
        return None

    return pontos  # Retorna os dados cacheados válidos


def consultar_google(grupo, timeframe):
    """Consulta o Google Trends e repete a tentativa se houver falha ou bloqueio."""
    for tentativa in range(1, TENTATIVAS + 1):  # Loop de 1 até 4 tentativas
        try:
            # Chama a API/scraper do Google Trends
            return download_google_trends_comparison(
                grupo, geo=GEO, timeframe=timeframe, category=CATEGORY
            )
        except Exception as erro:  # Se der erro de rede, timeout ou bloqueio (429)...
            print(f"  Falhou ({type(erro).__name__}: {erro}) - tentativa {tentativa}/{TENTATIVAS}")
            if tentativa < TENTATIVAS:  # Se ainda restam tentativas...
                espera = PAUSA_ERRO * tentativa  # Calcula espera crescente: 120s, 240s, 360s...
                print(f"  Aguardando {espera}s antes de tentar de novo...")
                time.sleep(espera)  # Pausa o script
    return None  # Se falhar em todas as tentativas, retorna None


def media(pontos, termo):
    """Calcula a média de buscas de um termo somando todas as semanas."""
    valores = [p["values"][termo] for p in pontos]  # Extrai a lista de números daquele termo
    return sum(valores) / len(valores)  # Soma tudo e divide pela quantidade de semanas


def coletar_medias(modo, generos):
    """Orquestra as buscas em lotes de 5, unifica as escalas pela âncora e agrupa por mês."""
    # Escolhe a janela de tempo de acordo com o modo decidido anteriormente
    timeframe = TIMEFRAME_COMPLETO if modo == "completo" else TIMEFRAME_ATUALIZAR

    # Busca na lista de tuplas do banco qual é o termo_busca correspondente à ANCORA ("Horror")
    termo_ancora = next(t for _, nome, t in generos if nome == ANCORA)
    # Separa todos os outros termos que não são a âncora
    outros = [t for _, nome, t in generos if nome != ANCORA]

    # Divide 'outros' em fatias de 4 em 4 e coloca a âncora na frente de cada fatia (total = 5 termos/lote)
    grupos = [[termo_ancora] + outros[i:i + 4] for i in range(0, len(outros), 4)]
    print(f"{len(generos)} gêneros -> {len(grupos)} buscas ({timeframe}, geo {GEO_GRAVAR})")

    resultados = []  # Guardará os dados semanais de cada lote
    for n, grupo in enumerate(grupos, start=1):  # Itera sobre cada lote numerado a partir de 1
        print(f"\nBusca {n}/{len(grupos)}: {grupo}")

        pontos = ler_cache(modo, n, grupo)  # Tenta carregar do cache local primeiro
        consultou_google = False  # Flag para saber se precisamos dar pausa anti-bloqueio depois

        if pontos is not None:
            print("  (vindo do arquivo salvo, sem consultar o Google)")
        else:
            env = consultar_google(grupo, timeframe)  # Vai na internet consultar o Google
            consultou_google = True
            if env is None:  # Se falhou todas as tentativas, encerra o programa avisando o usuário
                raise SystemExit(
                    "O Google não respondeu depois de várias tentativas. Rode de novo mais tarde: "
                    "as buscas que já deram certo ficam salvas e não se repetem."
                )
            # Salva a resposta bruta imediatamente no cache (default=str converte datas se houver)
            with open(arquivo_cache(modo, n), "w", encoding="utf-8") as f:
                json.dump(env, f, ensure_ascii=False, indent=2, default=str)

            pontos = so_pontos_fechados(env)  # Remove semana parcial
            # Checagem de segurança: garante que o Google devolveu exatamente os termos pedidos
            if not pontos or set(pontos[0]["values"].keys()) != set(grupo):
                print("ATENÇÃO: os nomes devolvidos são diferentes dos enviados (ou não veio nenhum dado).")
                print("Enviados: ", grupo)
                if pontos:
                    print("Devolvidos:", list(pontos[0]["values"].keys()))
                raise SystemExit("Parei antes de gravar. Me mande essa mensagem.")

        resultados.append(pontos)  # Adiciona os pontos válidos deste lote na lista geral
        print(f"  {len(pontos)} semanas recebidas")

        # Se acessou o Google e ainda há mais lotes pela frente, faz uma pausa aleatória
        if consultou_google and n < len(grupos):
            espera = PAUSA + random.uniform(0, PAUSA_EXTRA)  # Ex: 60s + 7.4s = 67.4s
            print(f"  Aguardando {espera:.0f}s para não ser bloqueado...")
            time.sleep(espera)

    # --- Normalização entre Lotes (Regra de Três pela Âncora) ---
    ref = media(resultados[0], termo_ancora)  # Calcula a média da âncora no Lote 1 (nossa régua padrão)
    if ref == 0:  # Evita divisão por zero caso a âncora não tenha tido buscas
        raise SystemExit("A âncora veio com média 0 na primeira busca. Não dá para ajustar a escala.")

    semanal = {}  # Dicionário plano: {(termo, "AAAA-MM-DD"): valor_ajustado}
    for i, pontos in enumerate(resultados):  # Percorre cada lote (i = 0, 1, 2...)
        m = media(pontos, termo_ancora)  # Média da âncora neste lote específico
        if m == 0:
            raise SystemExit(f"A âncora veio com média 0 na busca {i + 1}.")
        fator = ref / m  # Fator de correção para trazer os números deste lote à escala do Lote 1

        for p in pontos:  # Percorre cada semana do lote
            for termo, valor in p["values"].items():  # Percorre cada termo e seu valor naquela semana
                # Se não for o Lote 1 (i > 0), ignora a âncora pois já a pegamos no Lote 1
                if i > 0 and termo == termo_ancora:
                    continue
                # Multiplica o valor bruto pelo fator de ajuste e salva indexado por termo e data
                semanal[(termo, p["date"][:10])] = valor * fator

    # --- Agrupamento Semanal -> Mensal ---
    por_mes = defaultdict(list)  # Dicionário que cria listas automaticamente para chaves novas
    for (termo, data), valor in semanal.items():
        # data[:7] extrai "AAAA-MM" de "AAAA-MM-DD". Agrupa todas as semanas do mesmo mês na mesma lista
        por_mes[(termo, data[:7])].append(valor)

    # Retorna um dicionário com a média mensal apenas para meses que tenham >= 4 semanas e já estejam fechados
    return {
        (termo, mes): sum(v) / len(v)
        for (termo, mes), v in por_mes.items()
        if len(v) >= 4 and mes < MES_ATUAL
    }


# EXECUÇÃO PRINCIPAL - ETAPA 1: LER GÊNEROS DO BANCO DE DADOS
conexao = pymysql.connect(  # Abre conexão com o MySQL
    host=DB_HOST, user=DB_USER, password=DB_SENHA, database=DB_NOME
)
with conexao.cursor() as cursor:  # Cria um cursor para executar queries
    # Busca ID, nome amigável e termo exato de pesquisa ordenados pelo ID
    cursor.execute("SELECT id, nome, termo_busca FROM pesquisa_mid ORDER BY id")
    generos = cursor.fetchall()  # Traz todas as linhas como uma tupla de tuplas
conexao.close()  # Fecha a conexão imediatamente para não sofrer timeout enquanto o script consulta o Google

# Cria dicionários de tradução rápida (lookup) entre nome, ID e termo de busca
id_por_nome = {nome: id_ for id_, nome, termo in generos}
nome_por_termo = {termo: nome for id_, nome, termo in generos}


# EXECUÇÃO PRINCIPAL - ETAPA 2: DECIDIR MODO E COLETAR/ATUALIZAR DADOS
dados = carregar_dados()  # Tenta carregar o JSON histórico do disco
modo = decidir_modo(dados, generos)  # Decide o que precisa ser feito
print(f"Modo: {modo} | último mês fechado: {ULTIMO_FECHADO}")

if modo == "em_dia":
    # Nada a fazer na internet; pula direto para a Etapa 3 (sincronização com o banco)
    print("Os dados já estão em dia. Nenhuma requisição ao Google.")

elif modo == "completo":
    print("Coleta completa (5 anos).")
    medias = coletar_medias(modo, generos)  # Coleta e normaliza os 5 anos entre todos os lotes

    # Se já existia um arquivo JSON antigo, salva uma cópia de segurança (.bak) antes de sobrescrever
    if dados is not None:
        shutil.copy2(ARQUIVO_DADOS, ARQUIVO_DADOS + ".bak")

    # Encontra o maior valor médio mensal de todo o conjunto de dados
    maximo = max(medias.values())
    # Reinicia a estrutura do JSON do zero
    dados = {"meta": {}, "generos": {}}
    for _, nome, termo in generos:
        dados["generos"][nome] = {"termo": termo, "meses": {}}

    # Reescala todos os valores proporcionalmente para que o pico máximo global seja exatamente 100.0
    for (termo, mes), v in medias.items():
        dados["generos"][nome_por_termo[termo]]["meses"][mes] = round(v * 100 / maximo, 2)

else:  # modo == "atualizar"
    print("Atualização: busca os últimos 12 meses e acrescenta só os meses que faltam.")
    medias = coletar_medias(modo, generos)  # Busca apenas os últimos 12 meses

    # --- Ajuste de Escala com o Histórico ---
    # Como a busca de 12 meses tem seu próprio teto de 100, precisamos descobrir a proporção
    # entre os números antigos (salvos) e os números novos usando os meses que se sobrepõem.
    soma_guardado = 0
    soma_nova = 0
    meses_em_comum = set()  # Conjunto para contar quantos meses distintos serviram de base

    for (termo, mes), v in medias.items():
        # Verifica se esse mês já existia no JSON histórico para aquele gênero
        guardado = dados["generos"][nome_por_termo[termo]]["meses"].get(mes)
        if guardado is not None:  # Se existe nos dois, acumula os valores para comparar
            soma_guardado += guardado
            soma_nova += v
            meses_em_comum.add(mes)

    # Se não houver interseção entre o passado e a nova busca, não há como converter a escala com precisão
    if soma_guardado == 0 or soma_nova == 0:
        raise SystemExit(
            "Não há meses em comum entre o histórico e a busca nova para acertar a escala. "
            "Apague o arquivo de dados para refazer a coleta completa."
        )

    # Calcula o multiplicador que converte a escala da busca de 12m para a escala do arquivo de 5 anos
    fator_historico = soma_guardado / soma_nova
    print(f"Escala acertada com {len(meses_em_comum)} meses em comum (fator {fator_historico:.3f})")

    # Insere APENAS os meses inéditos no JSON, mantendo o passado intocado
    novos = 0
    for (termo, mes), v in medias.items():
        meses = dados["generos"][nome_por_termo[termo]]["meses"]
        if mes not in meses:  # Só grava se o mês ainda não existir
            meses[mes] = round(v * fator_historico, 2)  # Aplica o fator de conversão e arredonda
            novos += 1
    print(f"Meses novos acrescentados: {novos}")

# Se houve coleta ("completo" ou "atualizar"), atualiza os metadados e grava o JSON no disco
if modo != "em_dia":
    dados["meta"] = {
        "geo": GEO_GRAVAR,
        "ancora": ANCORA,
        "ultima_consulta": str(HOJE),
    }
    salvar_dados(dados)
    print(f"Dados salvos em {ARQUIVO_DADOS}")


# EXECUÇÃO PRINCIPAL - ETAPA 3: SINCRONIZAR O JSON COM O BANCO DE DADOS

# Prepara uma lista de tuplas pronta para inserção em lote no MySQL:
# Formato de cada linha: (fk_genero, "AAAA-MM-01", valor, geo)
linhas = [
    (id_por_nome[nome], mes + "-01", valor, GEO_GRAVAR)
    for nome, g in dados["generos"].items()
    if nome in id_por_nome  # Garante que só vai tentar inserir gêneros que ainda existem no banco
    for mes, valor in g["meses"].items()
]

conexao = pymysql.connect(  # Abre uma nova conexão com o MySQL para gravação
    host=DB_HOST, user=DB_USER, password=DB_SENHA, database=DB_NOME
)
with conexao.cursor() as cursor:
    # Executa o comando SQL para todas as linhas de uma vez (muito mais rápido que um loop de INSERTs)
    # ON DUPLICATE KEY UPDATE: se a chave (fk_genero, data_ref, geo) já existir, apenas atualiza o valor e a data
    cursor.executemany(
        """
        INSERT INTO interesse (fk_genero, data_ref, valor, geo)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE valor = VALUES(valor), coletado_em = NOW()
        """,
        linhas,
    )
conexao.commit()  # Confirma e efetiva a transação no banco de dados
conexao.close()  # Fecha a conexão

print(f"\nLinhas gravadas/atualizadas no banco: {len(linhas)}")