import json # traz o módulo json, que lê e grava arquivos .json (usado para guardar o que o Google devolveu)
 
import os # traz o módulo os, que tem o os.path.exists() para checar se um arquivo já existe
 
import time # traz o módulo time, que tem o time.sleep() usado para fazer pausas
 
from trendspyg import get_keyword_suggestions #essa função recebe um texto e devolve uma lista de dicionarios com mid, title e type que o Google Trends sugere para aquele texto buscado.

from trendspyg.exceptions import ParseError # ParseError é o erro que a biblioteca lança quando o Google devolve uma resposta que ela não consegue ler (acontece quando o Google bloqueia por excesso de buscas)



# Cria um dicionario que traz chave:valor. 
# A chave  em português (como vai aparecer no banco) e o valor em inglês (usada para achar o MID)
GENEROS = {
    "Action": "Action film",
    "Adventure": "Adventure film",
    "Animation": "Animation film",
    "Comedy": "Comedy film",
    "Crime": "Crime film",
    "Documentary": "Documentary film",
    "Drama": "Drama film",
    "Family": "Family film",
    "Fantasy": "Fantasy film",
    "History": "History film",
    "Horror": "Horror film",
    "Music": "Musical film",
    "Mystery": "Mystery film",
    "Romance": "Romance film",
    "Science Fiction": "Science fiction film",
    "Thriller": "Thriller film",
    "TV Movie": "TV movie",
    "War": "War film",
    "Western": "Western film",
}

# valores fixos que controlam o comportamento das pausas
PAUSA = 20          # segundos de espera entre um gênero e outro, para o Google não bloquear
PAUSA_ERRO = 30    # segundos de espera depois de um erro, antes de tentar de novo
TENTATIVAS = 3     # quantas vezes tenta o mesmo gênero antes de desistir
ARQUIVO = "mids_encontrados.json" # nome do arquivo onde vamos guardar tudo que o Google devolveu

# cria uma função que lê o arquivo salvo e devolve o conteúdo como dicionário
# se o arquivo ainda não existe (primeira execução), devolve um dicionário vazio
def carregar_salvos():
    if os.path.exists(ARQUIVO): # checa se o arquivo já está na pasta
        with open(ARQUIVO, "r", encoding="utf-8") as f: # abre para leitura ("r"); o with fecha o arquivo sozinho no fim. Esse encoding é a tabela de codificação que vai ser utilizada para ler  o arquivo
            return json.load(f) # converte o texto do .json de volta em dicionário python
    return {} # arquivo não existe: começa do zero

salvos = carregar_salvos()# lê o arquivo antes de começar; salvos vira um dicionário com o que já foi buscado em execuções anteriores
# (esta linha fica FORA da função, sem recuo: se ficasse dentro, depois do return, ela nunca seria executada)
 
 
# cria uma função que grava o dicionário inteiro no arquivo .json
# recebe o dicionário com tudo que já foi encontrado
def salvar(salvos):
    with open(ARQUIVO, "w", encoding="utf-8") as f: # abre para escrita ("w"); isso apaga o conteúdo antigo e escreve tudo de novo
        json.dump(salvos, f, ensure_ascii=False, indent=2) # ensure_ascii=False mantém os acentos; indent=2 deixa o arquivo legível fazendo a quebra de linhas por item, se não ele vem tudo numa linha só
 
 
# cria uma função que faz a busca no google trends e tenta de novo se der erro
# recebe a busca (texto em inglês) e devolve a lista de candidatos, ou None se desistir
def buscar_candidatos(busca):
    for tentativa in range(1, TENTATIVAS + 1): # aqui ele roda um for que vai guardar a variavel tentativa no tipo range que vai começar no 1 e ir até tentativas+1 para rodar 3x pq ele não vai até o ultimo(nesse caso, o 4 visto que tentativas ta configurado pra 3 e acrescentamos +1 no fim)
        try: # tenta executar a busca; se der erro, não quebra o script, cai no except
            return get_keyword_suggestions(busca) # deu certo: devolve a lista e a função termina aqui
        except ParseError: # só entra aqui se o erro for o ParseError (resposta estranha do Google)
            print(f"   Google devolveu resposta inesperada (tentativa {tentativa}/{TENTATIVAS})")
            if tentativa < TENTATIVAS: # só espera se ainda tiver tentativa sobrando
                print(f"   Aguardando {PAUSA_ERRO}s antes de tentar de novo...")
                time.sleep(PAUSA_ERRO) # pausa o script pelo número de segundos informado
    return None # chegou aqui = as 3 tentativas falharam, então devolve None (vazio) para avisar quem chamou
 
#roda esse for com a chave:valor sendo rotulados como nome:busca
for nome, busca in GENEROS.items():
    print("==", nome, "| busca:", busca) #printa esse cabeçalho no terminal
 
    # só usa o que está salvo se o gênero existe no arquivo E a busca for a mesma de antes
    # (se você trocar o texto da busca, ele entende que é outra pesquisa e consulta o Google de novo)
    if nome in salvos and salvos[nome]["busca"] == busca: # se nome/chave estiver já em salvos(json que a gente leu e salvou como dicionario) e salvos[nome/chave]["busca"/valor] for igual ao que já esta em salvos como valor, então:
        sugestoes = salvos[nome]["candidatos"] # pega a lista direto do arquivo, sem gastar consulta no Google
        consultou_google = False # guarda que dessa vez NÃO falamos com o Google (serve para pular a pausa no fim)
        print("   (vindo do arquivo salvo, sem consultar o Google)")
    else:
        sugestoes = buscar_candidatos(busca) # aqui a gente usa a função que definimos la em cima
        consultou_google = True # guarda que dessa vez falamos com o Google (a pausa no fim vai valer)
        if sugestoes is None: # se a função desistiu, não tem lista para percorrer
            print("   (falhou depois de várias tentativas; rode de novo mais tarde)")
            time.sleep(PAUSA)
            continue # pula o resto do código e vai direto para o próximo gênero
        if sugestoes: # só salva se a lista não veio vazia
            salvos[nome] = {"busca": busca, "candidatos": sugestoes} # guarda a busca usada e TODOS os candidatos (não só os de gênero) no dicionário, na memória
            salvar(salvos) # grava no arquivo a cada gênero, assim se o script quebrar no meio nada do que já foi achado se perde
 
    achou = False #boolean startando em false
    for candidatos in sugestoes: #percorre a lista de candidatos (que veio do google ou do arquivo)
        
        if "genre" in candidatos["type"].lower(): # Mostra só os candidatos cujo tipo contém "genre" (gênero)
            print("  ", candidatos["mid"], "|", candidatos["title"], "|", candidatos["type"])
            achou = True
    if not achou:
        print("   (nenhum candidato do tipo gênero)")
 
    if consultou_google: # só espera se de fato falamos com o Google; se veio do arquivo não precisa
        time.sleep(PAUSA) # espera alguns segundos antes de ir para o próximo gênero