from pydantic import BaseModel
from datetime import date
from typing import Optional

# Modelo para entrada de dados do cálculo
class ChequeInput(BaseModel):
    banco: str
    valor: float
    data_emissao: date
    data_analise: date
    cidade_emissao: str
    cidade_pagamento: str

# Modelo para resposta do cálculo (Contrato de Saída)
class CalculoResponse(BaseModel):
    status: str
    cor: str
    tipo_praca: str
    dt_apresentacao: str
    dt_execucao: str
    dt_monitoria: str
    msg_curta: str
    valor_formatado: str

# Modelo para entrada da IA (usa o resultado do cálculo anterior)
class IAInput(BaseModel):
    api_key: str
    dados_cheque: dict  # Pode ser refinado, mas dict serve para flexibilidade
    dados_calc: dict