from trendspyg import get_keyword_suggestions

GENEROS = {
    "Ação": "Action film",
    "Aventura": "Adventure film",
    "Comédia": "Comedy film",
    "Terror": "Horror film",
    "Ficção Científica": "Science fiction film",
    "Romance": "Romance film",
    "Animação": "Animation film",
    "Drama": "Drama film",
    "Suspense": "Thriller film",
    "SuperHeroi": "Superhero film",
    "Fantasia": "Fantasy film",
    "Crime": "Crime film",
    "Documentário": "Documentary film",
    "Familia": "Family film",
    "Musical": "Musical film",
    "Guerra": "War film",
}

for nome, busca in GENEROS.items():
    print("==", nome, "| busca:", busca)
    achou = False
    for c in get_keyword_suggestions(busca):
        # Mostra só os candidatos cujo tipo contém "genre" (gênero)
        if "genre" in c["type"].lower():
            print("  ", c["mid"], "|", c["title"], "|", c["type"])
            achou = True
    if not achou:
        print("   (nenhum candidato do tipo gênero)")