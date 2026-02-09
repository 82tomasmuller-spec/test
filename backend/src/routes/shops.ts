import { Router, Response } from 'express';
import { Shop, Monitor } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import validator from 'validator';

const router = Router();

// Get all shops for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shops = await Shop.findAll({
      where: { userId: req.userId },
      include: [{ model: Monitor, as: 'monitors' }],
      order: [['createdAt', 'DESC']],
    });

    res.json(shops);
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Chyba při načítání shopů' });
  }
});

// Get single shop
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [{ model: Monitor, as: 'monitors' }],
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    res.json(shop);
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Chyba při načítání shopu' });
  }
});

// Create shop
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, domain, description } = req.body;

    // Validation
    if (!name || !domain) {
      return res.status(400).json({ error: 'Název a doména jsou povinné' });
    }

    if (!validator.isURL(domain)) {
      return res.status(400).json({ error: 'Neplatná URL adresa' });
    }

    // Create shop
    const shop = await Shop.create({
      userId: req.userId!,
      name,
      domain,
      description,
    });

    res.status(201).json(shop);
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Chyba při vytváření shopu' });
  }
});

// Update shop
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, domain, description, enabled } = req.body;

    const shop = await Shop.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    // Validation
    if (domain && !validator.isURL(domain)) {
      return res.status(400).json({ error: 'Neplatná URL adresa' });
    }

    // Update shop
    if (name !== undefined) shop.name = name;
    if (domain !== undefined) shop.domain = domain;
    if (description !== undefined) shop.description = description;
    if (enabled !== undefined) shop.enabled = enabled;

    await shop.save();

    res.json(shop);
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci shopu' });
  }
});

// Delete shop
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    await shop.destroy();

    res.json({ message: 'Shop byl úspěšně smazán' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ error: 'Chyba při mazání shopu' });
  }
});

export default router;
