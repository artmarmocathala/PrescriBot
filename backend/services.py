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
        Atue como o Consultor de Cheques 'PrescriBot'. Baseado APENAS neste contexto: {IAService.BASE_LEGAL}
        
        ## DADOS DO CHEQUE:
        - **Banco:** {dados_cheque.get('banco', 'Não informado')}
        - **Valor:** {dados_cheque.get('valor', 'Não informado')}
        - **Cidade de Emissão:** {dados_cheque.get('cidade_emissao', 'Não informada')}
        - **Cidade de Pagamento:** {dados_cheque.get('cidade_pagamento', 'Não informada')}
        
        ## ANÁLISE MATEMÁTICA (já calculada):
        - **Status Atual:** {dados_calc.get('status', 'N/A')}
        - **Tipo de Praça:** {dados_calc.get('tipo_praca', 'N/A')}
        - **Prazo de Apresentação até:** {dados_calc.get('dt_apresentacao', 'N/A')}
        - **Prazo de Execução até:** {dados_calc.get('dt_execucao', 'N/A')}
        - **Prazo de Monitória até:** {dados_calc.get('dt_monitoria', 'N/A')}
        - **Resumo Técnico:** {dados_calc.get('msg_curta', 'N/A')}
        
        ## INSTRUÇÕES:
        Foque na clareza visual da mensagem, use listas e negrito para destacar pontos cruciais da análise, espace os parágrafos e separe claramente as seções.

        1. Explique o risco jurídico atual em no máximo 2 parágrafos, não mencione o número de parágrafos usado na resposta. Nomeie a seção como "Análise Jurídica". Cite as leis usadas na análise.
        2. Crie um modelo de mensagem de cobrança para E-mail adequado para esta fase. Nomeie a seção como "Modelo de E-mail de Cobrança".
        """
        
        response = model.generate_content(prompt)
        return response.text