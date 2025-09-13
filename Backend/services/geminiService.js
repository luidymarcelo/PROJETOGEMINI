import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBhLtsTJdPka52X9E5IJFU8HKTrhwQRY54"; // substitua
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function gerarDocumentacao(prompt, duvida) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let instrucoes = '';
    if (duvida) {
      instrucoes += `\n\nO usuário tem a seguinte dúvida específica sobre a view: "${duvida}". Responda a essa pergunta de forma clara e direta no início da documentação.`;
    }
    instrucoes += `\n\nScript SQL da view:\n\`\`\`sql\n${prompt}\n\`\`\``;

    const result = await model.generateContent(instrucoes);
    return (await result.response).text();
  } catch (error) {
    console.error('Erro ao gerar documentação com a IA:', error.message);
    return 'Erro ao gerar documentação com a IA.';
  }
}
