from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ChequeInput, IAInput
from services import CalculadoraService, IAService

app = FastAPI(title="PrescriBot API Modular")

# Configuração de CORS (Essencial para separar Front do Back)
# Permite que seu HTML (rodando na porta 5500 ou arquivo local) fale com o Python (porta 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/calcular")
def endpoint_calcular(dados: ChequeInput):
    try:
        resultado = CalculadoraService.analisar_prescricao(dados)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/consultar-ia")
def endpoint_ia(dados: IAInput):
    if not dados.api_key:
        raise HTTPException(status_code=400, detail="API Key obrigatória")
    try:
        parecer = IAService.consultar_parecer(dados.api_key, dados.dados_cheque, dados.dados_calc)
        return {"relatorio": parecer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Recarrega automaticamente se mudar arquivos
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)