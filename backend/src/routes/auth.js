import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { generateToken, authMiddleware } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, nif, address, postalCode, phone, userType, company } = req.body;

        // Validations
        if (!email || !password || !name || !nif || !address || !postalCode) {
            return res.status(400).json({ error: 'Email, password, name, NIF, address and postal code are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if NIF already exists
        const existingNif = await prisma.user.findUnique({
            where: { nif }
        });

        if (existingNif) {
            return res.status(400).json({ error: 'NIF/CIF already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and company (only for COMPANY type)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nif,
                address,
                postalCode,
                phone: phone || null,
                userType: userType || 'COMPANY',
                company: (userType === 'COMPANY' || !userType) && company ? {
                    create: {
                        name: company.name,
                        nif: company.nif || nif,
                        address: company.address || address,
                        postalCode: company.postalCode || postalCode,
                        email: company.email || email,
                        phone: company.phone || phone || ''
                    }
                } : undefined
            },
            include: {
                company: true
            }
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            companyId: user.company?.id
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                nif: user.nif,
                userType: user.userType,
                company: user.company
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            companyId: user.company?.id
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                company: user.company
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { company: true },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                company: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// Forgot password - Send reset email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // No revelar si el usuario existe o no (seguridad)
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        // Generar token de reseteo
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en BD (necesitas añadir campos al schema)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Enviar email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // No fallar si el email falla
        }

        res.json({ message: 'If the email exists, a reset link has been sent' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Buscar usuario por token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date() // Token no expirado
                }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar contraseña y limpiar token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

export default router;
