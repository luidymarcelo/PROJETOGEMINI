import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import corsConfig from './config/corsConfig.js';

const app = express();
const PORT = 3000;

app.use(cors(corsConfig));
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
