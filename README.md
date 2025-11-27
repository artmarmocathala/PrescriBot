# PrescriBot

PrescriBot é uma aplicação modular composta por uma API em Python (FastAPI) e uma interface frontend simples em HTML/JS. A aplicação utiliza IA Generativa (Google Generative AI) e serviços de cálculo para analisar cheques pós-datados e prescritos.

## Estrutura do Projeto

```
PrescriBot/
├── backend/           # Código da API (Python/FastAPI)
│   ├── main.py        # Ponto de entrada da API
│   ├── models.py      # Modelos de dados (Pydantic)
│   ├── services.py    # Lógica de negócios e integração com IA
│   └── requirements.txt # Dependências do Python
└── frontend/          # Interface do Usuário
    ├── index.html     # Página principal
    └── app.js         # Lógica do frontend
```

## Pré-requisitos

*   [Python 3.8+](https://www.python.org/downloads/) instalado.
*   Uma chave de API do Google (Gemini) configurada (verifique `services.py` ou variáveis de ambiente se necessário).

## Instalação e Configuração

### 1. Configurar o Backend

1.  Abra um terminal na pasta `backend`:
    ```bash
    cd backend
    ```

2.  Crie um ambiente virtual (recomendado):
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # Linux/Mac
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```

### 2. Executar a Aplicação

#### Iniciar o Backend (API)

Com o ambiente virtual ativado e dentro da pasta `backend`, execute:

```bash
uvicorn main:app --reload
```

A API estará rodando em: `http://127.0.0.1:8000`
A documentação automática (Swagger UI) pode ser acessada em: `http://127.0.0.1:8000/docs`

#### Iniciar o Frontend

Como o frontend é estático (HTML/JS), você tem duas opções:

**Opção A: Abrir diretamente**
*   Navegue até a pasta `frontend` e dê um duplo clique no arquivo `index.html` para abrir no seu navegador.

**Opção B: Servidor Local (Recomendado)**
*   Se você usa o VS Code, pode usar a extensão "Live Server".
*   Ou, usando Python em outro terminal na pasta `frontend`:
    ```bash
    cd frontend
    python -m http.server 5500
    ```
    Acesse `http://127.0.0.1:5500` no navegador.

## Notas

*   O backend está configurado com CORS (`allow_origins=["*"]`) para permitir requisições locais do frontend.
*   Certifique-se de que a API Key do Google Generative AI esteja configurada corretamente no código ou em variáveis de ambiente para que as funcionalidades de IA funcionem.

## Versão Executável (Windows)

Esta aplicação pode ser empacotada como um executável (`.exe`) para facilitar a distribuição no Windows, dispensando a instalação do Python pelo usuário final.

### Gerando o Executável

Você deve gerar o executável utilizando o comando do PyInstaller.

1.  Certifique-se de ter o `pyinstaller` instalado:
    ```bash
    pip install pyinstaller
    ```

2.  Navegue até a pasta `backend`:
    ```bash
    cd backend
    ```

3.  Execute o comando abaixo para gerar o executável. Este comando empacota a aplicação em um único arquivo (`--onefile`), inclui a pasta frontend (`--add-data`) e define o nome do executável:

    ```bash
    # windows
    pyinstaller --name="PrescriBot" --onefile --add-data "../frontend;frontend" main.py

    # linux
    pyinstaller --name="PrescriBot" --onefile --add-data "../frontend:frontend" main.py
    ```

    *   `--name="PrescriBot"`: Define o nome do executável.
    *   `--onefile`: Gera um único arquivo `.exe`.
    *   `--add-data "../frontend;frontend"`: Inclui a pasta `frontend` dentro do executável.

    > **Dica:** Adicione a flag `--windowed` ao comando se quiser ocultar a janela preta do terminal ao executar o programa.

4.  O executável será gerado na pasta `backend/dist/`.

### Executando

*   Vá até a pasta `backend/dist/`.
*   Execute o arquivo `PrescriBot.exe`.
*   A aplicação iniciará o servidor e abrirá automaticamente o navegador padrão com a interface do usuário.

