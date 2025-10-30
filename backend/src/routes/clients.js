import express from 'express';
import prisma from '../config/prisma.js';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all clients for the authenticated user's company
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.user;
        
        if (!companyId) {
            return res.status(400).json({ error: 'No company associated with user' });
        }

        const clients = await prisma.client.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clients);

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Error fetching clients' });
    }
});

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;

        const client = await prisma.client.findFirst({
            where: { 
                id,
                companyId 
            },
            include: {
                invoices: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);

    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Error fetching client' });
    }
});

// Search client by NIF (for autofill)
router.get('/search/:nif', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { nif } = req.params;

        const client = await prisma.client.findFirst({
            where: { 
                companyId,
                nif: {
                    equals: nif.toUpperCase(),
                    mode: 'insensitive'
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);

    } catch (error) {
        console.error('Search client error:', error);
        res.status(500).json({ error: 'Error searching client' });
    }
});

// Create client
router.post('/', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { name, nif, address, email, phone } = req.body;

        if (!name || !nif || !address || !email) {
            return res.status(400).json({ error: 'Name, NIF, address and email are required' });
        }

        // Check if client with same NIF already exists for this company
        const existingClient = await prisma.client.findFirst({
            where: {
                companyId,
                nif: nif.toUpperCase()
            }
        });

        if (existingClient) {
            return res.status(400).json({ error: 'Client with this NIF already exists' });
        }

        const client = await prisma.client.create({
            data: {
                companyId,
                name,
                nif: nif.toUpperCase(),
                address,
                email,
                phone: phone || null
            }
        });

        res.status(201).json(client);

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Error creating client' });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;
        const { name, nif, address, email, phone } = req.body;

        // Verify client belongs to user's company
        const existingClient = await prisma.client.findFirst({
            where: { id, companyId }
        });

        if (!existingClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(nif && { nif: nif.toUpperCase() }),
                ...(address && { address }),
                ...(email && { email }),
                ...(phone !== undefined && { phone })
            }
        });

        res.json(client);

    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Error updating client' });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;

        // Verify client belongs to user's company
        const client = await prisma.client.findFirst({
            where: { id, companyId }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        await prisma.client.delete({
            where: { id }
        });

        res.json({ message: 'Client deleted successfully' });

    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Error deleting client' });
    }
});

export default router;
