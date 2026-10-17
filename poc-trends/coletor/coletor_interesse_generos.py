import json
import time
from collections import defaultdict

import pymysql
from trendspyg import download_google_trends_comparison

import os
from dotenv import load_dotenv

# ---------- CONFIGURAÇÃO ----------
load_dotenv()  # lê o arquivo .env desta pasta

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_SENHA = os.getenv("DB_SENHA", "")
DB_NOME = os.getenv("DB_NOME", "poc_trends")

GEO = ""             # "BR" = Brasil | "" = mundo todo
TIMEFRAME = "today 5-y"  # últimos 5 anos
CATEGORY = 34           # 0 = sem filtro | 34 = só a categoria Filmes
ANCORA = "Terror"      # gênero que aparece em TODAS as buscas
PAUSA = 45             # segundos de espera entre uma busca e outra

# No banco, o país mundial é gravado como "WW"
GEO_GRAVAR = GEO or "WW"

# ---------- 1) LÊ OS GÊNEROS DO BANCO ----------
conexao = pymysql.connect(
    host=DB_HOST, user=DB_USER, password=DB_SENHA, database=DB_NOME
)
with conexao.cursor() as cursor:
    cursor.execute("SELECT id, nome, termo_busca FROM genero ORDER BY id")
    generos = cursor.fetchall()

id_por_termo = {termo: id_ for id_, nome, termo in generos}
termo_ancora = next(t for _, nome, t in generos if nome == ANCORA)
outros = [t for _, nome, t in generos if nome != ANCORA]

# ---------- 2) DIVIDE EM GRUPOS DE 5 (a âncora entra em todos) ----------
# O Google só compara 5 termos por busca
grupos = [[termo_ancora] + outros[i:i + 4] for i in range(0, len(outros), 4)]
print(f"{len(generos)} gêneros -> {len(grupos)} buscas")

# ---------- 3) FAZ AS BUSCAS ----------
resultados = []
for n, grupo in enumerate(grupos, start=1):
    print(f"\nBusca {n}/{len(grupos)}: {grupo}")
    env = download_google_trends_comparison(
        grupo, geo=GEO, timeframe=TIMEFRAME, category=CATEGORY
    )

    # Guarda a resposta crua em arquivo (assim não precisa buscar de novo se algo falhar)
    with open(f"bruto_grupo{n}.json", "w", encoding="utf-8") as f:
        json.dump(env, f, ensure_ascii=False, indent=2, default=str)

    # Descarta a semana que ainda não terminou
    pontos = [p for p in env["interest_over_time"] if not p["is_partial"]]

    # Confere se os nomes que voltaram são os mesmos que enviamos
    if set(pontos[0]["values"].keys()) != set(grupo):
        print("ATENÇÃO: os nomes devolvidos são diferentes dos enviados.")
        print("Enviados: ", grupo)
        print("Devolvidos:", list(pontos[0]["values"].keys()))
        raise SystemExit("Parei antes de gravar. Me mande essa mensagem.")

    resultados.append(pontos)
    print(f"  {len(pontos)} semanas recebidas")

    if n < len(grupos):
        print(f"  Aguardando {PAUSA}s para não ser bloqueado...")
        time.sleep(PAUSA)


# ---------- 4) COLOCA TUDO NA MESMA ESCALA USANDO A ÂNCORA ----------
def media(pontos, termo):
    valores = [p["values"][termo] for p in pontos]
    return sum(valores) / len(valores)


ref = media(resultados[0], termo_ancora)
if ref == 0:
    raise SystemExit("A âncora veio com média 0 na primeira busca. Não dá para ajustar a escala.")

semanal = {}  # (termo, data) -> valor ajustado
for i, pontos in enumerate(resultados):
    m = media(pontos, termo_ancora)
    if m == 0:
        raise SystemExit(f"A âncora veio com média 0 na busca {i + 1}.")
    fator = ref / m  # quanto multiplicar para igualar a escala da busca 1

    for p in pontos:
        for termo, valor in p["values"].items():
            if i > 0 and termo == termo_ancora:
                continue  # a âncora já veio da busca 1
            semanal[(termo, p["date"][:10])] = valor * fator

# ---------- 5) AGRUPA POR MÊS (média das semanas) ----------
por_mes = defaultdict(list)
for (termo, data), valor in semanal.items():
    por_mes[(termo, data[:7])].append(valor)  # data[:7] = "2025-10"

# Ignora meses com menos de 4 semanas (meses incompletos)
medias = {k: sum(v) / len(v) for k, v in por_mes.items() if len(v) >= 4}

# Reescala para que o maior valor de todos seja 100
maximo = max(medias.values())
linhas = [
    (id_por_termo[termo], mes + "-01", round(v * 100 / maximo, 2), GEO_GRAVAR)
    for (termo, mes), v in medias.items()
]

# ---------- 6) GRAVA NO BANCO ----------
with conexao.cursor() as cursor:
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

print(f"\nLinhas gravadas/atualizadas: {len(linhas)}")