import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 3000;

const GEMINI_API_KEY = "AIzaSyBhLtsTJdPka52X9E5IJFU8HKTrhwQRY54"; // Substitua pela sua chave de API!

app.use(cors());
app.use(express.json());

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function gerarDocumentacao(prompt, duvida) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Base das instruções para a IA
    let instrucoes = ``;

    // Adiciona a dúvida do usuário ao prompt se ela existir
    if (duvida) {
        instrucoes += `\n\nO usuário tem a seguinte dúvida específica sobre a view: "${duvida}". Responda a essa pergunta de forma clara e direta no início da documentação.`;
    }

    instrucoes += `\n\nScript SQL da view:\n\`\`\`sql\n${prompt}\n\`\`\`\n\.`;

    const result = await model.generateContent(instrucoes);
    const response = await result.response;
    const text = response.text();
    return text;

  } catch (error) {
    console.error('Erro ao gerar documentação com a IA:', error.message);
    return 'Erro ao gerar documentação com a IA.';
  }
}

// Rota que o front-end vai chamar
app.get('/api/view/:relatorio', async (req, res) => {
  const relatorio = req.params.relatorio;
  const duvida = req.query.duvida;

  try {

    let db = "BR"
    let token = await solictatoken(db)
    let API_URL = 'http://192.168.1.245:8055/rest/query'

    const getinforelatorio = await axios.request({
      method: 'GET',
      url: API_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        sql: `SELECT 
                  A.IND, 
                  A.NOM_IND, 
                  A.NOM_CONEXAO, 
                  A.USUARIO_CONEXAO, 
                  B.TEXTO_SQL, 
                  CASE 
                      WHEN REGEXP_SUBSTR(B.TEXTO_SQL, '[^ ]+', 1, 2) = 'EIS_DIMENSAO_DAT'
                          THEN REGEXP_SUBSTR(B.TEXTO_SQL, '[^ ]+', 1, 4)
                      ELSE REGEXP_SUBSTR(B.TEXTO_SQL, '[^ ]+', 1, 2)
                  END AS VIEW_PRINCIPAL
              FROM BI_IND A
              LEFT JOIN BI_IND_TABELA B 
                    ON A.IND = B.IND
              WHERE A.IND = '${relatorio}'`
      }
    });

    const viewName = getinforelatorio.data.Retorno[0].VIEW_PRINCIPAL.replace(/\s+/g, '');

    const origemdb = getinforelatorio.data.Retorno[0].NOM_CONEXAO.replace(/\s+/g, '');

    if (origemdb === "BI_PY") {
      db = "PY";
      API_URL = 'http://192.168.1.243:9995/rest/query'
      token = await solictatoken(db);
    } else {
      console.log("Não identificado origem do DB");
    }

    const schema = origemdb === "BI_PY" ? "PROTHEUSPY" : "PROTHEUS";

    const response = await axios.request({
      method: 'GET',
      url: API_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        sql: `SELECT
          DBMS_LOB.SUBSTR(ddl, 4000, 1)     AS PARTE1,
          DBMS_LOB.SUBSTR(ddl, 4000, 4001)  AS PARTE2,
          DBMS_LOB.SUBSTR(ddl, 4000, 8001)  AS PARTE3,
          DBMS_LOB.SUBSTR(ddl, 4000, 12001) AS PARTE4,
          DBMS_LOB.SUBSTR(ddl, 4000, 16001) AS PARTE5,
          DBMS_LOB.SUBSTR(ddl, 4000, 20001) AS PARTE6,
          DBMS_LOB.SUBSTR(ddl, 4000, 24001) AS PARTE7,
          DBMS_LOB.SUBSTR(ddl, 4000, 28001) AS PARTE8,
          DBMS_LOB.SUBSTR(ddl, 4000, 32001) AS PARTE9,
          DBMS_LOB.SUBSTR(ddl, 4000, 36001) AS PARTE10
          FROM
          (
            SELECT
              DBMS_METADATA.GET_DDL('VIEW', '${viewName}', '${schema}') AS ddl
            FROM
              dual
          )`
      }
    });

    const p = response.data.Retorno[0];

    const dados = 
        (p.PARTE1  || '') +
        (p.PARTE2  || '') +
        (p.PARTE3  || '') +
        (p.PARTE4  || '') +
        (p.PARTE5  || '') +
        (p.PARTE6  || '') +
        (p.PARTE7  || '') +
        (p.PARTE8  || '') +
        (p.PARTE9  || '') +
        (p.PARTE10 || '');

    if (!dados) {
      return res.status(404).json({ error: 'View não encontrada' });
    }

    // Gera documentação com Gemini
    const docAI = await gerarDocumentacao(dados,duvida);

    res.json({
      documentacao: docAI
    });

  } catch (error) {
    console.error('Erro ao consultar API:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

async function solictatoken(params) {
  if (params === "BR") {
    let API_TOKEN = 'http://192.168.1.245:8055/rest/api/oauth2/v1/token';
    try {
      const response = await axios.request({
        method: 'POST',
        url: API_TOKEN,
        params: {
          'grant_type': 'password',
          'password': 'tvsita2026',
          'username': 'Admin'
        }
      });
      return response.data.access_token; // retorna o token
    } catch (error) {
      console.error('Erro ao consultar API:', error.message);
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      return { status: 500, data: { error: 'Erro interno' } };
    }
  } else if (params === "PY") {
    let API_TOKEN = 'http://192.168.1.243:9995/rest/api/oauth2/v1/token';
    try {
      const response = await axios.request({
        method: 'POST',
        url: API_TOKEN,
        params: {
          'grant_type': 'password',
          'password': 'tvsita2023',
          'username': 'Admin'
        }
      });
      return response.data.access_token; // retorna o token
    } catch (error) {
      console.error('Erro ao consultar API:', error.message);
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      return { status: 500, data: { error: 'Erro interno' } };
    }
  } else {
    
  }
};

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


