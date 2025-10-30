import express from 'express';
import prisma from '../config/prisma.js';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();
router.use(authMiddleware);

// Buscar empresas por nombre
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const companies = await prisma.company.findMany({
            where: {
                name: {
                    contains: q,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                nif: true,
                address: true,
                email: true,
                phone: true
            },
            take: 10
        });

        res.json(companies);
    } catch (error) {
        console.error('Search companies error:', error);
        res.status(500).json({ error: 'Error searching companies' });
    }
});

// Obtener empresa por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const company = await prisma.company.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                nif: true,
                address: true,
                postalCode: true,
                email: true,
                phone: true
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Error fetching company' });
    }
});

// Listar todas las empresas (para dropdown)
router.get('/', async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                nif: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(companies);
    } catch (error) {
        console.error('List companies error:', error);
        res.status(500).json({ error: 'Error listing companies' });
    }
});

export default router;
