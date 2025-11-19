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


// 3. Lógica de Negócio (Cálculo + IA)
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
        btn.disabled = false;
        btn.innerText = originalText;
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