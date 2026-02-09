import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/config';
import { initDatabase } from './config/database';
import { scheduleMonitorChecks } from './jobs/monitorQueue';

// Import routes
import authRoutes from './routes/auth';
import shopRoutes from './routes/shops';
import monitorRoutes from './routes/monitors';
import incidentRoutes from './routes/incidents';
import statsRoutes from './routes/stats';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Příliš mnoho požadavků, zkuste to prosím později.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint nenalezen' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Interní chyba serveru' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Schedule monitor checks
    await scheduleMonitorChecks();

    // Start server
    app.listen(config.port, () => {
      console.log('');
      console.log('🚀 ShopAlert Backend Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🌐 Server: http://localhost:${config.port}`);
      console.log(`🏥 Health: http://localhost:${config.port}/health`);
      console.log(`📊 API: http://localhost:${config.port}/api`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
