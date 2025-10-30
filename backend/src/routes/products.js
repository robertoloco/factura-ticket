import express from 'express';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(501).json({ error: 'Not implemented yet' }));

export default router;
