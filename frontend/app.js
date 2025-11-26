// 1. Configuração Inicial de Datas
document.getElementById('emissao').valueAsDate = new Date('2023-06-15');
document.getElementById('analise').valueAsDate = new Date();

// 2. Lógica de Dark Mode
const themeToggleBtn = document.getElementById('themeToggle');
const iconSun = document.getElementById('iconSun');
const iconMoon = document.getElementById('iconMoon');
const html = document.documentElement;

// Verifica preferência salva ou do sistema
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    html.classList.add('dark');
    updateIcons(true);
} else {
    html.classList.remove('dark');
    updateIcons(false);
}

themeToggleBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateIcons(isDark);
});

function updateIcons(isDark) {
    if (isDark) {
        iconSun.classList.remove('hidden');
        iconMoon.classList.add('hidden');
    } else {
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
    }
}


// 3. Logica de Negócio (Calculo + IA)
const form = document.getElementById('calcForm');
const btn = document.getElementById('btnCalcular');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Loading
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Processando...';
    document.getElementById('resultCard').classList.add('hidden');
    document.getElementById('iaCard').classList.add('hidden');

    try {
        const payload = {
            banco: document.getElementById('banco').value,
            valor: parseFloat(document.getElementById('valor').value),
            data_emissao: document.getElementById('emissao').value,
            data_analise: document.getElementById('analise').value,
            cidade_emissao: document.getElementById('cid_e').value,
            cidade_pagamento: document.getElementById('cid_p').value
        };

        // Request Backend
        const response = await fetch('/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Falha na comunicação com a API.');
        
        const data = await response.json();
        renderizarCalculo(data);

        const apiKey = document.getElementById('apiKey').value;
        if (apiKey) {
            await consultarIA(apiKey, data, payload.valor);
        }

    } catch (error) {
        alert('Erro: ' + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

function renderizarCalculo(data) {
    const card = document.getElementById('resultCard');
    card.classList.remove('hidden');

    document.getElementById('dtApres').innerText = data.dt_apresentacao;
    document.getElementById('dtExec').innerText = data.dt_execucao;
    document.getElementById('dtMonit').innerText = data.dt_monitoria;
    document.getElementById('msgCurta').innerText = data.msg_curta;

    const badge = document.getElementById('statusBadge');
    badge.innerText = data.status;
    
    // Cores adaptadas para Dark Mode
    // Formato: { corBackend: 'classes-tailwind' }
    const colors = {
        'green': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        'orange': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
        'red': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        'blue': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    };
    
    const themeClasses = colors[data.cor] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    badge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase border ${themeClasses}`;
}

async function consultarIA(apiKey, dadosCalc, valorOriginal) {
    const iaCard = document.getElementById('iaCard');
    const loading = document.getElementById('iaLoading');
    const content = document.getElementById('iaContent');
    
    iaCard.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.innerHTML = '';

    try {
        const response = await fetch('/api/consultar-ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                dados_cheque: { valor: `R$ ${valorOriginal}` },
                dados_calc: dadosCalc
            })
        });

        const result = await response.json();
        content.innerHTML = marked.parse(result.relatorio);

    } catch (error) {
        content.innerText = "Erro ao consultar IA: " + error.message;
    } finally {
        loading.classList.add('hidden');
    }
}

// 4. Função para Salvar PDF
function salvarPDF() {
    // Coleta dados dos cards
    const statusBadge = document.getElementById('statusBadge').innerText;
    const dtApres = document.getElementById('dtApres').innerText;
    const dtExec = document.getElementById('dtExec').innerText;
    const dtMonit = document.getElementById('dtMonit').innerText;
    const msgCurta = document.getElementById('msgCurta').innerText;
    
    // Dados do formulário
    const banco = document.getElementById('banco').value;
    const valor = document.getElementById('valor').value;
    const emissao = document.getElementById('emissao').value;
    const analise = document.getElementById('analise').value;
    const cidEmissao = document.getElementById('cid_e').value;
    const cidPagto = document.getElementById('cid_p').value;
    
    // Verifica se há parecer da IA
    const iaCard = document.getElementById('iaCard');
    const iaContent = document.getElementById('iaContent');
    const temIA = iaCard && !iaCard.classList.contains('hidden') && iaContent.innerHTML.trim() !== '';
    
    // Monta o HTML do PDF
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório PrescriBot</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 800px; margin: 0 auto; }
                h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
                h2 { color: #1e3a8a; margin-top: 30px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
                .info-item { background: #f1f5f9; padding: 10px; border-radius: 6px; }
                .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
                .info-value { font-weight: bold; color: #1e293b; }
                .datas-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; text-align: center; }
                .data-box { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .data-box.apres { background: #f8fafc; }
                .data-box.exec { background: #fefce8; border-color: #fef08a; }
                .data-box.monit { background: #fff7ed; border-color: #fed7aa; }
                .data-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
                .data-value { font-family: monospace; font-size: 14px; font-weight: bold; }
                .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; margin: 10px 0; }
                .status.prescrito { background: #fee2e2; color: #991b1b; }
                .status.vigente { background: #dcfce7; color: #166534; }
                .conclusao { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .ia-section { background: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
                .ia-section h2 { color: #7c3aed; margin-top: 0; }
                .rodape { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
        </head>
        <body>
            <h1>📋 Relatório PrescriBot</h1>
            <p style="color: #64748b;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <h2>📝 Dados do Título</h2>
            <div class="info-grid">
                <div class="info-item"><div class="info-label">Banco</div><div class="info-value">${banco}</div></div>
                <div class="info-item"><div class="info-label">Valor</div><div class="info-value">R$ ${parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div></div>
                <div class="info-item"><div class="info-label">Data de Emissão</div><div class="info-value">${emissao.split('-').reverse().join('/')}</div></div>
                <div class="info-item"><div class="info-label">Data da Análise</div><div class="info-value">${analise.split('-').reverse().join('/')}</div></div>
                <div class="info-item"><div class="info-label">Cidade de Emissão</div><div class="info-value">${cidEmissao}</div></div>
                <div class="info-item"><div class="info-label">Cidade de Pagamento</div><div class="info-value">${cidPagto}</div></div>
            </div>
            
            <h2>⚖️ Análise Jurídica</h2>
            <p><strong>Status:</strong> <span class="status ${statusBadge.toLowerCase().includes('prescri') ? 'prescrito' : 'vigente'}">${statusBadge}</span></p>
            
            <div class="datas-grid">
                <div class="data-box apres"><div class="data-label">Prazo Apresentação</div><div class="data-value">${dtApres}</div></div>
                <div class="data-box exec"><div class="data-label">Prazo Execução</div><div class="data-value">${dtExec}</div></div>
                <div class="data-box monit"><div class="data-label">Prazo Monitória</div><div class="data-value">${dtMonit}</div></div>
            </div>
            
            <div class="conclusao">
                <strong>💡 Conclusão:</strong> ${msgCurta}
            </div>
            
            ${temIA ? `
            <div class="ia-section">
                <h2>🤖 Parecer da IA</h2>
                ${iaContent.innerHTML}
            </div>
            ` : ''}
            
            <div class="rodape">
                Documento gerado automaticamente pelo PrescriBot - Calculadora de Prescrição de Cheques<br>
                Este relatório tem caráter informativo e não substitui consulta jurídica profissional.
            </div>
        </body>
        </html>
    `);
    janelaImpressao.document.close();
    
    // Envia heartbeat antes de imprimir (a janela de print bloqueia o JS)
    fetch('/api/heartbeat').catch(() => {});
    
    janelaImpressao.print();
    
    // Envia heartbeat depois de fechar a janela de impressão
    fetch('/api/heartbeat').catch(() => {});
}

// 5. Heartbeat (sinal de vida para o backend)
// Se o navegador fechar, o backend para de receber isso e se desliga em 5s.
setInterval(() => {
    fetch('/api/heartbeat')
        .catch(err => {
            //  se falhar e pq o back ja morreu ou esta fechando
        });
}, 2000);