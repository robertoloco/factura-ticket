import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateToken, authMiddleware } from '../utils/jwt.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, company } = req.body;

        // Validations
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password and name are required' });
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and company
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                company: company ? {
                    create: {
                        name: company.name,
                        nif: company.nif,
                        address: company.address,
                        email: company.email,
                        phone: company.phone
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

export default router;
