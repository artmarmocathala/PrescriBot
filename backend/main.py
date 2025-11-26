import os
import sys
import webbrowser
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from models import ChequeInput, IAInput
from services import CalculadoraService, IAService
import time
import threading
import os

# Função para achar os arquivos quando rodar como .exe (PyInstaller)
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath("..") # Assume que backend e frontend são irmãos no modo dev
    return os.path.join(base_path, relative_path)

app = FastAPI(title="PrescriBot App")

# --- Mecanismo de Auto-Shutdown (Heartbeat) ---
# Variável global para rastrear o último sinal de vida do frontend
last_heartbeat = time.time()
SHUTDOWN_TIMEOUT = 30  # Segundos sem heartbeat para desligar (tempo extra para imprimir PDF)

def shutdown_monitor(): # monitora o front
    global last_heartbeat
    # tempo pro navegador abrir
    time.sleep(15)
    
    while True:
        # Se passou do tempo limite sem sinal
        if time.time() - last_heartbeat > SHUTDOWN_TIMEOUT:
            print("Frontend desconectado. Encerrando servidor...")
            os._exit(0) # Encerra o processo imediatamente
        time.sleep(2)

# Inicia o monitor em uma thread separada se estiver rodando como executável (PyInstaller)
# Isso evita que o servidor feche sozinho durante o desenvolvimento
if getattr(sys, 'frozen', False):
    threading.Thread(target=shutdown_monitor, daemon=True).start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rotas da API ---
@app.post("/api/calcular")
def endpoint_calcular(dados: ChequeInput):
    try:
        return CalculadoraService.analisar_prescricao(dados)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/consultar-ia")
def endpoint_ia(dados: IAInput):
    if not dados.api_key:
        raise HTTPException(status_code=400, detail="API Key obrigatória")
    try:
        return {"relatorio": IAService.consultar_parecer(dados.api_key, dados.dados_cheque, dados.dados_calc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/heartbeat")
def heartbeat(): # sinal de vida do front
    global last_heartbeat
    last_heartbeat = time.time()
    return {"status": "alive"}

# --- Servir o Frontend (HTML/JS) ---
path_frontend = resource_path("frontend")

if os.path.exists(path_frontend):
    app.mount("/", StaticFiles(directory=path_frontend, html=True), name="static")
else:
    print(f"⚠️ AVISO: Pasta frontend não encontrada em: {path_frontend}")

# --- Inicialização Automática ---
if __name__ == "__main__":
    # Abre o navegador automaticamente após 1.5 segundos
    from threading import Timer
    def open_browser():
        webbrowser.open("http://127.0.0.1:8000")
    
    Timer(1.5, open_browser).start()
    
    # Roda o servidor
    uvicorn.run(app, host="127.0.0.1", port=8000)