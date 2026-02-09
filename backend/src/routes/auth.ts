import { Router, Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import validator from 'validator';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Všechna pole jsou povinná' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Neplatný email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Uživatel s tímto emailem již existuje' });
    }

    // Create user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Chyba při registraci' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email a heslo jsou povinné' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Chyba při přihlašování' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Chyba při načítání uživatele' });
  }
});

export default router;
