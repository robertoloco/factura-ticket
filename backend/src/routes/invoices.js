import express from 'express';
import prisma from '../config/prisma.js';
import { authMiddleware } from '../utils/jwt.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { sendInvoiceEmail } from '../utils/email.js';

const router = express.Router();
router.use(authMiddleware);

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.user;
        
        const invoices = await prisma.invoice.findMany({
            where: { companyId },
            include: {
                client: true,
                items: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Error fetching invoices' });
    }
});

// Get next invoice number
router.get('/next-number', async (req, res) => {
    try {
        const { companyId } = req.user;
        const year = new Date().getFullYear();
        
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                companyId,
                number: {
                    startsWith: `${year}-`
                }
            },
            orderBy: { number: 'desc' }
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const lastNumber = parseInt(lastInvoice.number.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        const invoiceNumber = `${year}-${nextNumber.toString().padStart(3, '0')}`;
        res.json({ number: invoiceNumber });

    } catch (error) {
        console.error('Get next number error:', error);
        res.status(500).json({ error: 'Error generating invoice number' });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    try {
        const { userId, companyId } = req.user;
        const { clientId, number, description, baseAmount, items } = req.body;

        const taxRate = 21.0;
        const taxAmount = (baseAmount * taxRate) / 100;
        const totalAmount = baseAmount + taxAmount;

        const invoice = await prisma.invoice.create({
            data: {
                userId,
                companyId,
                clientId,
                number,
                description,
                baseAmount,
                taxRate,
                taxAmount,
                totalAmount,
                items: {
                    create: items || []
                }
            },
            include: {
                client: true,
                company: true,
                items: true
            }
        });

        res.status(201).json(invoice);

    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Error creating invoice' });
    }
});

// Send invoice by email
router.post('/:id/send', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;

        const invoice = await prisma.invoice.findFirst({
            where: { id, companyId },
            include: {
                client: true,
                company: true,
                items: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(invoice);
        
        // Send email
        await sendInvoiceEmail(invoice, pdfBuffer);

        // Update status
        await prisma.invoice.update({
            where: { id },
            data: { status: 'SENT' }
        });

        res.json({ message: 'Invoice sent successfully' });

    } catch (error) {
        console.error('Send invoice error:', error);
        res.status(500).json({ error: 'Error sending invoice' });
    }
});

export default router;
