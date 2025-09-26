import axios from 'axios';

async function solicitarToken(db) {
  let url, password;
  if (db === "BR") {
    url = 'http://192.168.1.245:8055/rest/api/oauth2/v1/token';
    password = 'tvsita2025';
  } else if (db === "PY") {
    url = 'http://192.168.1.243:9995/rest/api/oauth2/v1/token';
    password = 'tvsita2026';
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

  let viewName = info.data.Retorno[0].VIEW_PRINCIPAL.replace(/\s+/g, '');
  let origemdb = info.data.Retorno[0].NOM_CONEXAO.replace(/\s+/g, '');

  if (origemdb === "BI_PY") {
    db = "PY";
    API_URL = 'http://192.168.1.243:9995/rest/query';
    token = await solicitarToken(db);
  }

  const schema = origemdb === "BI_PY" ? "PROTHEUSPY" : "PROTHEUS";

  const ddlResponse = await axios.get(API_URL, {
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

  const p = ddlResponse.data.Retorno[0];
  const ddl = (p.PARTE1||'')+(p.PARTE2||'')+(p.PARTE3||'')+(p.PARTE4||'')+(p.PARTE5||'')+
              (p.PARTE6||'')+(p.PARTE7||'')+(p.PARTE8||'')+(p.PARTE9||'')+(p.PARTE10||'');

  // 3) Busca tabelas e campos relacionados
  const depsResponse = await axios.get(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      sql: `SELECT  
                RTRIM(A.REFERENCED_NAME) AS TABELA, 
                RTRIM(B.X2_NOME) AS NOME_TABELA,
                RTRIM(C.X3_CAMPO) AS CAMPO,
                RTRIM(C.X3_TITULO) AS TITULO,
                RTRIM(C.X3_DESCRIC) AS DESCRICAO
            FROM ALL_DEPENDENCIES A
            LEFT JOIN SX2010 B
                ON UPPER(RTRIM(A.REFERENCED_NAME)) = UPPER(RTRIM(B.X2_ARQUIVO))
            LEFT JOIN SX3010 C
                ON UPPER(RTRIM(B.X2_CHAVE)) = UPPER(RTRIM(C.X3_ARQUIVO))
            WHERE A.NAME = '${viewName}'
              AND A.TYPE = 'VIEW'`
    }
  });

  const dependencias = depsResponse.data.Retorno;

  // 4) Retorno consolidado
  return {
    view: viewName,
    schema,
    ddl
    //dependencias
  };
}
