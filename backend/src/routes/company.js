import express from 'express';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json({ message: 'Company routes - not implemented yet' }));

export default router;
