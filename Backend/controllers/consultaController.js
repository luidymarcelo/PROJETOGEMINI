import { gerarDocumentacao } from '../services/geminiService.js';
import { buscarViewTotvs } from '../services/totvsService.js';

export const consultarView = async (req, res) => {
  const relatorio = req.params.relatorio;
  const duvida = req.query.duvida;

  try {
    const dadosView = await buscarViewTotvs(relatorio);

    const dadosViewJSON = JSON.stringify(dadosView, null, 2);

    if (!dadosView) {
      return res.status(404).json({ error: 'View não encontrada' });
    }

    const docAI = await gerarDocumentacao(dadosViewJSON, duvida);

    res.json({ documentacao: docAI });
  } catch (error) {
    console.error('Erro ao consultar API:', error.message);
    res.status(500).json({ error: 'Erro interno' });
  }
};
