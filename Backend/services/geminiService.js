import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyChQgBIrtiVGna2UeHs4DrMa_D_J_SAuTU"; // substitua
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function gerarDocumentacao(prompt, duvida) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let instrucoes = '';
    if (duvida) {
      instrucoes += `\n\nO usuário tem a seguinte dúvida específica sobre o relatório gerado pela view: "${duvida}". Na resposta deve ser iniciada com um resumo do que faz o relatório. Após, um resumo das tabelas usadas ex. SA1 -> Cdastro de Cliente e etc. Após um detalhamento de cada campo com seu alias junto ao campo original ex. Código de cliente - A1_COD - COD_CLIENT junto com fórmula se tiver coloque de uma forma de fácil entendimento ao usuário final tente pular 1 linha a cada campo explicado e etc.`;
    }
    instrucoes += `\n\nScript SQL da view:\n\`\`\`sql\n${prompt}\n\`\`\``;

    const result = await model.generateContent(instrucoes);
    return (await result.response).text();
  } catch (error) {
    console.error('Erro ao gerar documentação com a IA:', error.message);
    return 'Erro ao gerar documentação com a IA.';
  }
}
