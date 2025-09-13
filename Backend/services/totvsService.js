import axios from 'axios';

async function solicitarToken(db) {
  let url, password;
  if (db === "BR") {
    url = 'http://192.168.1.245:8055/rest/api/oauth2/v1/token';
    password = 'tvsita2026';
  } else if (db === "PY") {
    url = 'http://192.168.1.243:9995/rest/api/oauth2/v1/token';
    password = 'tvsita2023';
  } else {
    throw new Error('Banco desconhecido');
  }

  const response = await axios.post(url, null, {
    params: {
      grant_type: 'password',
      username: 'Admin',
      password
    }
  });
  return response.data.access_token;
}

export async function buscarViewTotvs(relatorio) {
  let db = "BR";
  let token = await solicitarToken(db);
  let API_URL = 'http://192.168.1.245:8055/rest/query';

  const info = await axios.get(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      sql: `SELECT ... WHERE A.IND='${relatorio}'` // coloque o SQL completo
    }
  });

  let viewName = info.data.Retorno[0].VIEW_PRINCIPAL.replace(/\s+/g, '');
  let origemdb = info.data.Retorno[0].NOM_CONEXAO.replace(/\s+/g, '');

  if (origemdb === "BI_PY") {
    db = "PY";
    API_URL = 'http://192.168.1.243:9995/rest/query';
    token = await solicitarToken(db);
  }

  const schema = origemdb === "BI_PY" ? "PROTHEUSPY" : "PROTHEUS";

  const response = await axios.get(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      sql: `SELECT
              DBMS_LOB.SUBSTR(ddl, 4000, 1) AS PARTE1,
              ...
              DBMS_LOB.SUBSTR(ddl, 4000, 36001) AS PARTE10
            FROM (
              SELECT DBMS_METADATA.GET_DDL('VIEW','${viewName}','${schema}') AS ddl FROM dual
            )`
    }
  });

  const p = response.data.Retorno[0];
  return (p.PARTE1||'')+(p.PARTE2||'')+(p.PARTE3||'')+(p.PARTE4||'')+(p.PARTE5||'')+
         (p.PARTE6||'')+(p.PARTE7||'')+(p.PARTE8||'')+(p.PARTE9||'')+(p.PARTE10||'');
}
