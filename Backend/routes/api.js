import express from 'express';
import { consultarView } from '../controllers/consultaController.js';

const router = express.Router();

router.get('/view/:relatorio', consultarView);

export default router;