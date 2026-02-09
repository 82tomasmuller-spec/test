import { Router, Response } from 'express';
import { Monitor, Shop, Incident } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import validator from 'validator';

const router = Router();

// Get all monitors for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const monitors = await Monitor.findAll({
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(monitors);
  } catch (error) {
    console.error('Get monitors error:', error);
    res.status(500).json({ error: 'Chyba při načítání monitorů' });
  }
});

// Get monitors for specific shop
router.get('/shop/:shopId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verify shop ownership
    const shop = await Shop.findOne({
      where: { id: req.params.shopId, userId: req.userId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    const monitors = await Monitor.findAll({
      where: { shopId: req.params.shopId },
      order: [['createdAt', 'DESC']],
    });

    res.json(monitors);
  } catch (error) {
    console.error('Get shop monitors error:', error);
    res.status(500).json({ error: 'Chyba při načítání monitorů' });
  }
});

// Get single monitor
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const monitor = await Monitor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
        {
          model: Incident,
          as: 'incidents',
          limit: 10,
          order: [['startedAt', 'DESC']],
        },
      ],
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nenalezen' });
    }

    res.json(monitor);
  } catch (error) {
    console.error('Get monitor error:', error);
    res.status(500).json({ error: 'Chyba při načítání monitoru' });
  }
});

// Create monitor
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, url, checkInterval } = req.body;

    // Validation
    if (!shopId || !url) {
      return res.status(400).json({ error: 'Shop a URL jsou povinné' });
    }

    if (!validator.isURL(url)) {
      return res.status(400).json({ error: 'Neplatná URL adresa' });
    }

    // Verify shop ownership
    const shop = await Shop.findOne({
      where: { id: shopId, userId: req.userId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    // Create monitor
    const monitor = await Monitor.create({
      shopId,
      url,
      checkInterval: checkInterval || 300000, // Default 5 minutes
    });

    res.status(201).json(monitor);
  } catch (error) {
    console.error('Create monitor error:', error);
    res.status(500).json({ error: 'Chyba při vytváření monitoru' });
  }
});

// Update monitor
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { url, checkInterval, enabled } = req.body;

    const monitor = await Monitor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nenalezen' });
    }

    // Validation
    if (url && !validator.isURL(url)) {
      return res.status(400).json({ error: 'Neplatná URL adresa' });
    }

    // Update monitor
    if (url !== undefined) monitor.url = url;
    if (checkInterval !== undefined) monitor.checkInterval = checkInterval;
    if (enabled !== undefined) monitor.enabled = enabled;

    await monitor.save();

    res.json(monitor);
  } catch (error) {
    console.error('Update monitor error:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci monitoru' });
  }
});

// Delete monitor
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const monitor = await Monitor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nenalezen' });
    }

    await monitor.destroy();

    res.json({ message: 'Monitor byl úspěšně smazán' });
  } catch (error) {
    console.error('Delete monitor error:', error);
    res.status(500).json({ error: 'Chyba při mazání monitoru' });
  }
});

export default router;
