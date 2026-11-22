import json
import os
import random
import shutil
import time
from collections import defaultdict
from datetime import date, timedelta

import pymysql
from dotenv import load_dotenv
from trendspyg import download_google_trends_comparison

# ---------- CONFIGURAÇÃO ----------
load_dotenv()  # lê o arquivo .env desta pasta

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_SENHA = os.getenv("DB_SENHA", "")
DB_NOME = os.getenv("DB_NOME", "nextframe_trendspyg")

GEO = ""                          # "BR" = Brasil | "" = mundo todo
TIMEFRAME_COMPLETO = "today 5-y"  # primeira coleta: últimos 5 anos
TIMEFRAME_ATUALIZAR = "today 12-m"  # atualizações: últimos 12 meses (se sobrepõe ao que já está salvo)
CATEGORY = 34                     # 0 = sem filtro | 34 = só a categoria Filmes
ANCORA = "Thriller"               # gênero que aparece em TODAS as buscas (nome igual ao da tabela pesquisa_mid)
                                  # de porte médio de propósito: grande o bastante para medir a escala, sem esmagar os pequenos

# Ordem dos gêneros do MAIOR para o MENOR interesse (baseada na primeira coleta).
# Serve para montar os grupos de busca: gêneros grandes juntos, pequenos juntos.
# Assim o termo gigante de uma busca não comprime os pequenos para perto de zero.
# Gênero que não estiver na lista vai para o fim; a âncora não precisa estar aqui.
ORDEM_TAMANHO = [
    "Horror", "Documentary", "Comedy", "Action", "Romance",
    "Thriller", "Animation", "War", "Western", "Science Fiction",
    "Drama", "Adventure", "Crime", "Mystery", "Fantasy",
    "TV Movie", "Music", "History", "Family",
]

# --- Margens de tempo para não tomar limite de requisição ---
PAUSA = 60         # segundos de espera entre uma busca e outra
PAUSA_EXTRA = 15   # sorteia de 0 a 15s a mais, para não ficar um padrão certinho
PAUSA_ERRO = 120   # espera base depois de um erro (multiplica pela tentativa: 120s, 240s, 360s...)
TENTATIVAS = 4     # quantas vezes tenta a mesma busca antes de desistir
CACHE_HORAS = 24   # reaproveita a resposta crua de uma busca se ela tiver menos de 24h

# No banco, o mundo todo é gravado como "WW"
GEO_GRAVAR = GEO or "WW"

# Arquivo onde os dados ficam guardados para sempre (é a fonte da verdade; o banco é preenchido a partir dele)
ARQUIVO_DADOS = f"dados_interesse_{GEO_GRAVAR}.json"

# Datas de referência: só guardamos meses FECHADOS (anteriores ao mês atual)
HOJE = date.today()
MES_ATUAL = HOJE.strftime("%Y-%m")
ULTIMO_FECHADO = (HOJE.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")


# ---------- FUNÇÕES AUXILIARES ----------
def carregar_dados():
    if os.path.exists(ARQUIVO_DADOS):
        with open(ARQUIVO_DADOS, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def salvar_dados(dados):
    # Ordena os meses de cada gênero para o arquivo ficar legível
    for g in dados["generos"].values():
        g["meses"] = dict(sorted(g["meses"].items()))
    # Grava num arquivo temporário e troca no fim: se o script cair no meio, o arquivo bom não corrompe
    with open(ARQUIVO_DADOS + ".tmp", "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    os.replace(ARQUIVO_DADOS + ".tmp", ARQUIVO_DADOS)


def decidir_modo(dados, generos):
    """
    completo  = não tem dados salvos (ou mudou geo, âncora, gênero ou termo): busca 5 anos
    atualizar = falta algum mês fechado: busca os últimos 12 meses e acrescenta só o que falta
    em_dia    = não falta nada: nenhuma requisição ao Google
    """
    if dados is None:
        return "completo"
    meta = dados.get("meta", {})
    if meta.get("geo") != GEO_GRAVAR or meta.get("ancora") != ANCORA:
        return "completo"

    ultimos = []
    for _, nome, termo in generos:
        g = dados.get("generos", {}).get(nome)
        if g is None or g["termo"] != termo or not g["meses"]:
            return "completo"
        ultimos.append(max(g["meses"]))

    if min(ultimos) >= ULTIMO_FECHADO:
        return "em_dia"
    if meta.get("ultima_consulta") == str(HOJE):
        return "em_dia"  # já consultou hoje e o Google ainda não tinha o mês novo: não insiste
    return "atualizar"


def arquivo_cache(modo, n):
    # Modo e geo entram no nome para nunca misturar buscas diferentes
    return f"bruto_{GEO_GRAVAR}_{modo}_grupo{n}.json"


def so_pontos_fechados(env):
    # Descarta a semana que ainda não terminou
    return [p for p in env["interest_over_time"] if not p["is_partial"]]


def ler_cache(modo, n, grupo):
    """Devolve os pontos salvos se o arquivo existe, é recente e é do mesmo grupo de termos."""
    caminho = arquivo_cache(modo, n)
    if not os.path.exists(caminho):
        return None
    idade_horas = (time.time() - os.path.getmtime(caminho)) / 3600
    if idade_horas > CACHE_HORAS:
        return None
    with open(caminho, "r", encoding="utf-8") as f:
        env = json.load(f)
    pontos = so_pontos_fechados(env)
    if not pontos or set(pontos[0]["values"].keys()) != set(grupo):
        return None
    return pontos


def consultar_google(grupo, timeframe):
    """Faz a busca e tenta de novo se der erro, esperando cada vez mais."""
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            return download_google_trends_comparison(
                grupo, geo=GEO, timeframe=timeframe, category=CATEGORY
            )
        except Exception as erro:
            print(f"  Falhou ({type(erro).__name__}: {erro}) - tentativa {tentativa}/{TENTATIVAS}")
            if tentativa < TENTATIVAS:
                espera = PAUSA_ERRO * tentativa
                print(f"  Aguardando {espera}s antes de tentar de novo...")
                time.sleep(espera)
    return None


def media(pontos, termo):
    valores = [p["values"][termo] for p in pontos]
    return sum(valores) / len(valores)


def coletar_medias(modo, generos):
    """
    Faz as buscas no Google (5 termos por vez, âncora em todas), coloca tudo na mesma escala
    pela âncora e devolve {(termo, "AAAA-MM"): média mensal}, só de meses fechados.
    """
    timeframe = TIMEFRAME_COMPLETO if modo == "completo" else TIMEFRAME_ATUALIZAR

    termo_ancora = next(t for _, nome, t in generos if nome == ANCORA)
    termo_por_nome = {nome: t for _, nome, t in generos}
    nome_por_termo_local = {t: nome for _, nome, t in generos}

    # Ordena os outros gêneros do maior para o menor (os que não estão na lista vão para o fim)
    nomes_outros = [nome for _, nome, _ in generos if nome != ANCORA]
    nomes_outros.sort(
        key=lambda nome: ORDEM_TAMANHO.index(nome) if nome in ORDEM_TAMANHO else len(ORDEM_TAMANHO)
    )
    outros = [termo_por_nome[nome] for nome in nomes_outros]

    # O Google só compara 5 termos por busca: âncora + 4 gêneros de tamanho parecido
    grupos = [[termo_ancora] + outros[i:i + 4] for i in range(0, len(outros), 4)]
    print(f"{len(generos)} gêneros -> {len(grupos)} buscas ({timeframe}, geo {GEO_GRAVAR})")
    for n, grupo in enumerate(grupos, start=1):
        print(f"  Grupo {n}: {[nome_por_termo_local[t] for t in grupo]}")

    resultados = []
    for n, grupo in enumerate(grupos, start=1):
        print(f"\nBusca {n}/{len(grupos)}: {grupo}")

        pontos = ler_cache(modo, n, grupo)
        consultou_google = False

        if pontos is not None:
            print("  (vindo do arquivo salvo, sem consultar o Google)")
        else:
            env = consultar_google(grupo, timeframe)
            consultou_google = True
            if env is None:
                raise SystemExit(
                    "O Google não respondeu depois de várias tentativas. Rode de novo mais tarde: "
                    "as buscas que já deram certo ficam salvas e não se repetem."
                )
            with open(arquivo_cache(modo, n), "w", encoding="utf-8") as f:
                json.dump(env, f, ensure_ascii=False, indent=2, default=str)

            pontos = so_pontos_fechados(env)
            if not pontos or set(pontos[0]["values"].keys()) != set(grupo):
                print("ATENÇÃO: os nomes devolvidos são diferentes dos enviados (ou não veio nenhum dado).")
                print("Enviados: ", grupo)
                if pontos:
                    print("Devolvidos:", list(pontos[0]["values"].keys()))
                raise SystemExit("Parei antes de gravar. Me mande essa mensagem.")

        resultados.append(pontos)
        print(f"  {len(pontos)} semanas recebidas")

        if consultou_google and n < len(grupos):
            espera = PAUSA + random.uniform(0, PAUSA_EXTRA)
            print(f"  Aguardando {espera:.0f}s para não ser bloqueado...")
            time.sleep(espera)

    # --- Mesma escala pela âncora ---
    ref = media(resultados[0], termo_ancora)
    if ref == 0:
        raise SystemExit("A âncora veio com média 0 na primeira busca. Não dá para ajustar a escala.")

    semanal = {}
    for i, pontos in enumerate(resultados):
        m = media(pontos, termo_ancora)
        if m == 0:
            raise SystemExit(f"A âncora veio com média 0 na busca {i + 1}.")
        fator = ref / m
        for p in pontos:
            for termo, valor in p["values"].items():
                if i > 0 and termo == termo_ancora:
                    continue
                semanal[(termo, p["date"][:10])] = valor * fator

    # --- Agrupa por mês ---
    por_mes = defaultdict(list)
    for (termo, data), valor in semanal.items():
        por_mes[(termo, data[:7])].append(valor)

    # Só meses com pelo menos 4 semanas E já fechados (anteriores ao mês atual)
    return {
        (termo, mes): sum(v) / len(v)
        for (termo, mes), v in por_mes.items()
        if len(v) >= 4 and mes < MES_ATUAL
    }


# ---------- 1) LÊ OS GÊNEROS DO BANCO ----------
conexao = pymysql.connect(
    host=DB_HOST, user=DB_USER, password=DB_SENHA, database=DB_NOME
)
with conexao.cursor() as cursor:
    cursor.execute("SELECT id, nome, termo_busca FROM pesquisa_mid ORDER BY id")
    generos = cursor.fetchall()
conexao.close()  # as buscas demoram minutos; a gravação abre outra conexão

id_por_nome = {nome: id_ for id_, nome, termo in generos}
nome_por_termo = {termo: nome for id_, nome, termo in generos}

# ---------- 2) DECIDE O QUE PRECISA BUSCAR ----------
dados = carregar_dados()
modo = decidir_modo(dados, generos)
print(f"Modo: {modo} | último mês fechado: {ULTIMO_FECHADO}")

if modo == "em_dia":
    print("Os dados já estão em dia. Nenhuma requisição ao Google.")

elif modo == "completo":
    print("Coleta completa (5 anos).")
    medias = coletar_medias(modo, generos)

    # Guarda uma cópia do arquivo antigo antes de refazer tudo
    if dados is not None:
        shutil.copy2(ARQUIVO_DADOS, ARQUIVO_DADOS + ".bak")

    # Reescala para que o maior valor de todos seja 100
    maximo = max(medias.values())
    dados = {"meta": {}, "generos": {}}
    for _, nome, termo in generos:
        dados["generos"][nome] = {"termo": termo, "meses": {}}
    for (termo, mes), v in medias.items():
        dados["generos"][nome_por_termo[termo]]["meses"][mes] = round(v * 100 / maximo, 2)

else:  # modo == "atualizar"
    print("Atualização: busca os últimos 12 meses e acrescenta só os meses que faltam.")
    medias = coletar_medias(modo, generos)

    # Cada busca do Google tem escala própria (o maior valor dela vira 100).
    # Por isso comparamos os meses que já estão salvos com os mesmos meses da busca nova
    # e calculamos um fator para colocar os meses novos na escala do histórico.
    soma_guardado = 0
    soma_nova = 0
    meses_em_comum = set()
    for (termo, mes), v in medias.items():
        guardado = dados["generos"][nome_por_termo[termo]]["meses"].get(mes)
        if guardado is not None:
            soma_guardado += guardado
            soma_nova += v
            meses_em_comum.add(mes)
    if soma_guardado == 0 or soma_nova == 0:
        raise SystemExit(
            "Não há meses em comum entre o histórico e a busca nova para acertar a escala. "
            "Apague o arquivo de dados para refazer a coleta completa."
        )
    fator_historico = soma_guardado / soma_nova
    print(f"Escala acertada com {len(meses_em_comum)} meses em comum (fator {fator_historico:.3f})")

    # O histórico NÃO é alterado: entram só os meses que ainda não existem
    novos = 0
    for (termo, mes), v in medias.items():
        meses = dados["generos"][nome_por_termo[termo]]["meses"]
        if mes not in meses:
            meses[mes] = round(v * fator_historico, 2)
            novos += 1
    print(f"Meses novos acrescentados: {novos}")

if modo != "em_dia":
    dados["meta"] = {
        "geo": GEO_GRAVAR,
        "ancora": ANCORA,
        "ultima_consulta": str(HOJE),
    }
    salvar_dados(dados)
    print(f"Dados salvos em {ARQUIVO_DADOS}")

# ---------- 3) GRAVA NO BANCO A PARTIR DO JSON ----------
# Roda sempre (não gasta requisição): o banco fica igual ao arquivo
linhas = [
    (id_por_nome[nome], mes + "-01", valor, GEO_GRAVAR)
    for nome, g in dados["generos"].items()
    if nome in id_por_nome
    for mes, valor in g["meses"].items()
]

conexao = pymysql.connect(
    host=DB_HOST, user=DB_USER, password=DB_SENHA, database=DB_NOME
)
with conexao.cursor() as cursor:
    if modo == "completo":
        # O JSON foi refeito do zero (escala nova): remove as linhas antigas desse geo
        # para não sobrar mês da escala anterior misturado com a nova
        cursor.execute("DELETE FROM interesse WHERE geo = %s", (GEO_GRAVAR,))
    cursor.executemany(
        """
        INSERT INTO interesse (fk_genero, data_ref, valor, geo)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE valor = VALUES(valor), coletado_em = NOW()
        """,
        linhas,
    )
conexao.commit()
conexao.close()

print(f"\nLinhas gravadas/atualizadas no banco: {len(linhas)}")