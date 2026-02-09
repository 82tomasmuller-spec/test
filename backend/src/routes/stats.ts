import { Router, Response } from 'express';
import { Incident, Monitor, Shop } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import sequelize from '../config/database';

const router = Router();

// Get uptime statistics for a shop
router.get('/uptime/:shopId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { days = '7' } = req.query;

    // Verify shop ownership
    const shop = await Shop.findOne({
      where: { id: req.params.shopId, userId: req.userId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop nenalezen' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string, 10));

    // Get all monitors for this shop
    const monitors = await Monitor.findAll({
      where: { shopId: req.params.shopId },
    });

    if (monitors.length === 0) {
      return res.json({ uptime: 100, incidents: 0, totalChecks: 0 });
    }

    // Get incidents for the time period
    const incidents = await Incident.findAll({
      where: {
        monitorId: monitors.map((m) => m.id),
        startedAt: {
          [Op.gte]: daysAgo,
        },
      },
    });

    // Calculate total downtime in minutes
    let totalDowntimeMs = 0;
    for (const incident of incidents) {
      const endTime = incident.resolvedAt || new Date();
      totalDowntimeMs += endTime.getTime() - new Date(incident.startedAt).getTime();
    }

    // Calculate uptime percentage
    const totalTimeMs = Date.now() - daysAgo.getTime();
    const uptime = ((totalTimeMs - totalDowntimeMs) / totalTimeMs) * 100;

    res.json({
      uptime: Math.round(uptime * 100) / 100,
      incidents: incidents.length,
      totalDowntimeMinutes: Math.round(totalDowntimeMs / 1000 / 60),
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Get uptime error:', error);
    res.status(500).json({ error: 'Chyba při načítání uptime statistik' });
  }
});

// Get response time statistics for a monitor
router.get('/response-time/:monitorId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { days = '7' } = req.query;

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

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string, 10));

    // Get incidents with response times
    const incidents = await Incident.findAll({
      where: {
        monitorId: req.params.monitorId,
        startedAt: {
          [Op.gte]: daysAgo,
        },
        responseTime: {
          [Op.not]: null,
        },
      },
      attributes: ['responseTime', 'startedAt'],
      order: [['startedAt', 'ASC']],
    });

    // Calculate average response time
    const responseTimes = incidents.map((i: any) => i.responseTime);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
      : 0;

    // Format data for chart
    const chartData = incidents.map((i: any) => ({
      timestamp: i.startedAt,
      responseTime: i.responseTime,
    }));

    res.json({
      average: avgResponseTime,
      min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      data: chartData,
    });
  } catch (error) {
    console.error('Get response time error:', error);
    res.status(500).json({ error: 'Chyba při načítání response time statistik' });
  }
});

// Get dashboard overview
router.get('/overview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get total shops
    const totalShops = await Shop.count({
      where: { userId: req.userId },
    });

    // Get total monitors
    const totalMonitors = await Monitor.count({
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
    });

    // Get active incidents (ongoing)
    const activeIncidents = await Incident.count({
      where: { status: 'ongoing' },
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

    // Get incidents in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentIncidents = await Incident.count({
      where: {
        startedAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
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

    // Get monitors by status
    const monitorsUp = await Monitor.count({
      where: { status: 'up' },
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
    });

    const monitorsDown = await Monitor.count({
      where: { status: 'down' },
      include: [
        {
          model: Shop,
          as: 'shop',
          where: { userId: req.userId },
        },
      ],
    });

    res.json({
      totalShops,
      totalMonitors,
      activeIncidents,
      recentIncidents,
      monitorsUp,
      monitorsDown,
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Chyba při načítání přehledu' });
  }
});

export default router;
