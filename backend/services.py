from datetime import date, timedelta
import google.generativeai as genai
from models import ChequeInput, CalculoResponse

# --- Lógica de Domínio (Matemática Jurídica) ---
class CalculadoraService:
    @staticmethod
    def analisar_prescricao(dados: ChequeInput) -> CalculoResponse:
        # 1. Regra da Praça
        mesma_praca = (dados.cidade_emissao.strip().lower() == dados.cidade_pagamento.strip().lower())
        prazo_apresentacao_dias = 30 if mesma_praca else 60
        tipo_praca_txt = "Mesma Praça" if mesma_praca else "Praças Diferentes"

        # 2. Cálculo de Datas
        dt_limite_apresentacao = dados.data_emissao + timedelta(days=prazo_apresentacao_dias)
        dt_prescricao_executiva = dt_limite_apresentacao + timedelta(days=180) # + 6 meses da lei
        dt_prescricao_monitoria = dados.data_emissao + timedelta(days=(365 * 5)) # Súmula 503 STJ (5 anos)

        # 3. Definição de Status
        if dados.data_analise < dados.data_emissao:
            cor, tit, msg = "blue", "PRÉ-DATADO (FUTURO)", "Aguardar data pactuada."
        elif dados.data_analise <= dt_limite_apresentacao:
            dias = (dt_limite_apresentacao - dados.data_analise).days
            cor, tit, msg = "green", "VIGENTE (PRAZO DE APRESENTAÇÃO)", f"Correr para o banco! Restam {dias} dias."
        elif dados.data_analise <= dt_prescricao_executiva:
            cor, tit, msg = "yellow", "VENCIDO APRESENTAÇÃO (CABE EXECUÇÃO)", "Cheque tem força executiva. Protestar e Executar."
        elif dados.data_analise <= dt_prescricao_monitoria:
            cor, tit, msg = "orange", "PRESCRITO (CABE MONITÓRIA)", "Perdeu força executiva. Ajuizar Ação Monitória (Súmula 299)."
        else:
            cor, tit, msg = "red", "TOTALMENTE PRESCRITO", "Dívida natural. Apenas cobrança amigável."

        # Retorno tipado
        return CalculoResponse(
            status=tit,
            cor=cor,
            tipo_praca=tipo_praca_txt,
            dt_apresentacao=dt_limite_apresentacao.strftime('%d/%m/%Y'),
            dt_execucao=dt_prescricao_executiva.strftime('%d/%m/%Y'),
            dt_monitoria=dt_prescricao_monitoria.strftime('%d/%m/%Y'),
            msg_curta=msg,
            valor_formatado=f"R$ {dados.valor:,.2f}"
        )

# --- Lógica de Infraestrutura (Google Gemini) ---
class IAService:
    BASE_LEGAL = """
    CONTEXTO JURÍDICO OBRIGATÓRIO:
    Lei 7.357/85 (Lei do Cheque):
    - Art. 33: Prazo apresentação: 30 dias (mesma praça) ou 60 dias (praças diferentes).
    - Art. 47 e 59: Prescrição da Execução em 6 meses após fim do prazo de apresentação.
    Súmulas STJ:
    - Súmula 299: Cabe Ação Monitória para cheque prescrito.
    - Súmula 531: Na Monitória não precisa provar a origem da dívida (causa debendi).
    - Tema 628 STJ: Prazo para Monitória é de 5 anos a contar da emissão.
    - Tema 945 STJ: O protesto é possível enquanto houver prazo para execução cambial.
    """

    @staticmethod
    def consultar_parecer(api_key: str, dados_cheque: dict, dados_calc: dict) -> str:
        genai.configure(api_key=api_key)
        # Usando modelo flash para rapidez
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
        Atue como o Consultor Jurídico 'PrescriBot'. Baseado APENAS neste contexto: {IAService.BASE_LEGAL}
        Analise este caso:
        - Valor: {dados_cheque['valor']}
        - Status: {dados_calc['status']}
        - Resumo Técnico: {dados_calc['msg_curta']}
        - Data Limite Execução: {dados_calc['dt_execucao']}

        1. Explique o risco jurídico atual em 1 parágrafo.
        2. Crie um modelo de mensagem de cobrança para E-mail adequado para esta fase.
        """
        
        response = model.generate_content(prompt)
        return response.text