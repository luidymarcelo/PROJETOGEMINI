async function consultarRelatorio() {
    const relatorio = document.getElementById('relatorio').value.trim();
    const duvida = document.getElementById('duvida').value.trim();
    const statusEl = document.getElementById('status');
    const resultContainerEl = document.getElementById('resultContainer');
    const resultadoEl = document.getElementById('resultado');

    resultContainerEl.style.display = 'none';
    statusEl.style.display = 'block';
    statusEl.textContent = 'Carregando...';

    if (!relatorio) {
        statusEl.textContent = 'Digite o nome da view!';
        return;
    }

    try {
        // Modifica a URL para enviar a dúvida como parâmetro de query
        const url = new URL(`http://localhost:3000/api/view/${relatorio}`);
        if (duvida) {
            url.searchParams.append('duvida', duvida);
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao consultar a API');
        }
        
        const data = await response.json();
        
        // Formata o resultado em HTML
        const formattedContent = `
            <h4>Documentação:</h4>
            <pre>${data.documentacao}</pre>
        `;

        resultadoEl.innerHTML = formattedContent;
        resultContainerEl.style.display = 'block';
        statusEl.style.display = 'none';
        
    } catch (error) {
        statusEl.textContent = `Erro: ${error.message}`;
    }
}