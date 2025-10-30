import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { authMiddleware } from '../utils/jwt.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { sendInvoiceEmail } from '../utils/email.js';
import { extractTextFromImage } from '../utils/ocr.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(authMiddleware);

// Helper: Generate ticket hash
const generateTicketHash = (date, amount, companyId) => {
    const data = `${date.toISOString()}_${amount}_${companyId}`;
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Helper: Generate invoice number
const generateInvoiceNumber = async (companyId) => {
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            companyId,
            number: { startsWith: `${year}-` }
        },
        orderBy: { number: 'desc' }
    });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.number) {
        const lastNumber = parseInt(lastInvoice.number.split('-')[1]);
        nextNumber = lastNumber + 1;
    }

    return `${year}-${nextNumber.toString().padStart(3, '0')}`;
};

// ========== CLIENTE ENDPOINTS ==========

// Cliente: Solicitar factura desde ticket
router.post('/request', upload.single('ticketImage'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { clientData, companyId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Ticket image is required' });
        }

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        // 1. OCR - Extraer datos del ticket
        const ocrData = await extractTextFromImage(req.file.buffer);
        
        if (!ocrData.amount || !ocrData.date) {
            return res.status(400).json({ 
                error: 'No se pudieron extraer datos necesarios del ticket (fecha y/o importe)',
                ocrData 
            });
        }

        // 2. Buscar empresa por ID
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return res.status(404).json({ 
                error: 'Empresa no encontrada'
            });
        }

        // 3. Validar ticket único
        const ticketDate = new Date(ocrData.date);
        const ticketHash = generateTicketHash(ticketDate, ocrData.amount, company.id);

        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                companyId: company.id,
                ticketHash
            }
        });

        if (existingInvoice) {
            return res.status(409).json({ 
                error: 'Este ticket ya ha sido facturado',
                existingInvoice: {
                    id: existingInvoice.id,
                    number: existingInvoice.number,
                    status: existingInvoice.status
                }
            });
        }

        // 4. Crear o actualizar Client
        const client = await prisma.client.upsert({
            where: {
                companyId_nif: {
                    companyId: company.id,
                    nif: clientData.nif
                }
            },
            update: {
                name: clientData.name,
                email: clientData.email,
                address: clientData.address,
                postalCode: clientData.postalCode,
                phone: clientData.phone || null,
                userId
            },
            create: {
                companyId: company.id,
                userId,
                name: clientData.name,
                nif: clientData.nif,
                email: clientData.email,
                address: clientData.address,
                postalCode: clientData.postalCode,
                phone: clientData.phone || null
            }
        });

        // 5. Calcular montos
        const baseAmount = ocrData.amount / 1.21; // Asumiendo IVA 21%
        const taxAmount = ocrData.amount - baseAmount;

        // 6. Crear Invoice con estado PENDING
        const invoice = await prisma.invoice.create({
            data: {
                requesterId: userId,
                companyId: company.id,
                clientId: client.id,
                ticketDate,
                ticketAmount: ocrData.amount,
                ticketHash,
                ticketImageUrl: null, // TODO: Upload to cloud storage
                ocrData: ocrData,
                baseAmount,
                taxAmount,
                totalAmount: ocrData.amount,
                status: 'PENDING',
                items: {
                    create: (ocrData.items || []).map(item => ({
                        description: item.description,
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.totalPrice || 0
                    }))
                }
            },
            include: {
                company: true,
                client: true,
                items: true
            }
        });

        res.status(201).json({
            invoice,
            message: `Solicitud enviada a ${company.name}`
        });

    } catch (error) {
        console.error('Request invoice error:', error);
        res.status(500).json({ error: 'Error al solicitar factura' });
    }
});

// Cliente: Ver mis solicitudes
router.get('/my-requests', async (req, res) => {
    try {
        const { userId } = req.user;
        
        const invoices = await prisma.invoice.findMany({
            where: { requesterId: userId },
            include: {
                company: true,
                client: true,
                items: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ error: 'Error fetching requests' });
    }
});

// ========== EMPRESA ENDPOINTS ==========

// Empresa: Ver solicitudes pendientes
router.get('/pending', async (req, res) => {
    try {
        const { companyId } = req.user;
        
        if (!companyId) {
            return res.status(403).json({ error: 'Solo empresas pueden acceder a esta ruta' });
        }

        const invoices = await prisma.invoice.findMany({
            where: { 
                companyId,
                status: 'PENDING'
            },
            include: {
                client: true,
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get pending invoices error:', error);
        res.status(500).json({ error: 'Error fetching pending invoices' });
    }
});

// Empresa: Ver facturas aprobadas/generadas
router.get('/approved', async (req, res) => {
    try {
        const { companyId } = req.user;
        
        if (!companyId) {
            return res.status(403).json({ error: 'Solo empresas pueden acceder a esta ruta' });
        }

        const invoices = await prisma.invoice.findMany({
            where: { 
                companyId,
                status: { in: ['APPROVED', 'GENERATED'] }
            },
            include: {
                client: true,
                items: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get approved invoices error:', error);
        res.status(500).json({ error: 'Error fetching approved invoices' });
    }
});

// Empresa: Aprobar solicitud y generar factura
router.post('/:id/approve', async (req, res) => {
    try {
        const { userId, companyId } = req.user;
        const { id } = req.params;
        const { items, notes } = req.body;

        if (!companyId) {
            return res.status(403).json({ error: 'Solo empresas pueden aprobar facturas' });
        }

        // Buscar factura
        const invoice = await prisma.invoice.findFirst({
            where: { 
                id, 
                companyId,
                status: 'PENDING'
            },
            include: {
                client: true,
                company: true,
                items: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
        }

        // Generar número de factura
        const invoiceNumber = await generateInvoiceNumber(companyId);

        // Actualizar factura a APPROVED
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                number: invoiceNumber,
                status: 'APPROVED',
                approverId: userId,
                approvedAt: new Date(),
                description: notes || null
            },
            include: {
                client: true,
                company: true,
                items: true
            }
        });

        // Generar PDF
        const pdfBuffer = await generateInvoicePDF(updatedInvoice);
        
        // Enviar email al cliente
        await sendInvoiceEmail(updatedInvoice, pdfBuffer);

        // Actualizar a GENERATED
        await prisma.invoice.update({
            where: { id },
            data: { 
                status: 'GENERATED',
                generatedAt: new Date()
            }
        });

        res.json({
            invoice: updatedInvoice,
            message: 'Factura generada y enviada al cliente'
        });

    } catch (error) {
        console.error('Approve invoice error:', error);
        res.status(500).json({ error: 'Error al aprobar factura' });
    }
});

// Empresa: Rechazar solicitud
router.post('/:id/reject', async (req, res) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;
        const { reason } = req.body;

        if (!companyId) {
            return res.status(403).json({ error: 'Solo empresas pueden rechazar facturas' });
        }

        const invoice = await prisma.invoice.findFirst({
            where: { 
                id, 
                companyId,
                status: 'PENDING'
            },
            include: {
                client: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
        }

        // Actualizar a REJECTED
        await prisma.invoice.update({
            where: { id },
            data: { 
                status: 'REJECTED',
                rejectionReason: reason || 'No especificada'
            }
        });

        // TODO: Enviar email de notificación al cliente

        res.json({ message: 'Solicitud rechazada' });

    } catch (error) {
        console.error('Reject invoice error:', error);
        res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
});

// ========== AMBOS ==========

// Ver detalle de factura
router.get('/:id', async (req, res) => {
    try {
        const { userId, companyId } = req.user;
        const { id } = req.params;

        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                OR: [
                    { requesterId: userId },  // Cliente que la solicitó
                    { companyId: companyId }  // Empresa
                ]
            },
            include: {
                client: true,
                company: true,
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json(invoice);

    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Error fetching invoice' });
    }
});

// OCR endpoint
router.post('/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });
        const data = await extractTextFromImage(req.file.buffer);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error processing image' });
    }
});

export default router;
