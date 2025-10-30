import express from 'express';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/stats', (req, res) => res.json({ invoices: 0, clients: 0, revenue: 0 }));

export default router;
