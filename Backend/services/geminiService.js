import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyChQgBIrtiVGna2UeHs4DrMa_D_J_SAuTU"; // substitua
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function gerarDocumentacao(prompt, duvida) {
  try {
    const config = {
      thinkingConfig: {
        thinkingBudget: 0, 
      },
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      config: config
    });

    let instrucoes = '';
    if (duvida) {
      instrucoes += `\n\nO usuário tem a seguinte dúvida específica sobre o relatório gerado pela view: "${duvida}". Quero uma resposta o mais simples possível.`;
    } else {
      instrucoes += `Quero uma resposta o mais simples possível.`;
    }
    
    instrucoes += `\n\nScript SQL da view:\n\`\`\`sql\n${prompt}\n\`\`\``;

    const result = await model.generateContent(instrucoes);
    return (await result.response).text();

  } catch (error) {
    console.error('Erro ao gerar documentação com a IA:', error.message);
    return 'Erro ao gerar documentação com a IA.';
  }
}