import { Router, Response } from 'express';
import { Incident, Monitor, Shop } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// Get all incidents for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const incidents = await Incident.findAll({
      where,
      include: [
        {
          model: Monitor,
          as: 'monitor',
          include: [
            {
              model: Shop,
              as: 'shop',
              where: { userId: req.userId },
            },
          ],
        },
      ],
      order: [['startedAt', 'DESC']],
      limit: parseInt(limit as string, 10),
    });

    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Chyba při načítání incidentů' });
  }
});

// Get incidents for specific monitor
router.get('/monitor/:monitorId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verify monitor ownership
    const monitor = await Monitor.findOne({
      where: { id: req.params.monitorId },
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

    const incidents = await Incident.findAll({
      where: { monitorId: req.params.monitorId },
      order: [['startedAt', 'DESC']],
    });

    res.json(incidents);
  } catch (error) {
    console.error('Get monitor incidents error:', error);
    res.status(500).json({ error: 'Chyba při načítání incidentů' });
  }
});

// Get single incident
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const incident = await Incident.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Monitor,
          as: 'monitor',
          include: [
            {
              model: Shop,
              as: 'shop',
              where: { userId: req.userId },
            },
          ],
        },
      ],
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident nenalezen' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Chyba při načítání incidentu' });
  }
});

// Export incidents to CSV
router.get('/export/csv', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.startedAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const incidents = await Incident.findAll({
      where,
      include: [
        {
          model: Monitor,
          as: 'monitor',
          include: [
            {
              model: Shop,
              as: 'shop',
              where: { userId: req.userId },
            },
          ],
        },
      ],
      order: [['startedAt', 'DESC']],
    });

    // Generate CSV
    const csvHeader = 'ID,Shop,URL,Status,Error,HTTP Code,Response Time,Started At,Resolved At,Duration\n';
    const csvRows = incidents.map((incident: any) => {
      const monitor = incident.monitor;
      const shop = monitor.shop;
      const duration = incident.resolvedAt
        ? Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()) / 1000 / 60)
        : 'N/A';

      return [
        incident.id,
        shop.name,
        monitor.url,
        incident.status,
        incident.errorMessage || '',
        incident.httpCode || '',
        incident.responseTime || '',
        new Date(incident.startedAt).toISOString(),
        incident.resolvedAt ? new Date(incident.resolvedAt).toISOString() : '',
        duration,
      ]
        .map((field) => `"${field}"`)
        .join(',');
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=incidents.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export incidents error:', error);
    res.status(500).json({ error: 'Chyba při exportu incidentů' });
  }
});

export default router;
