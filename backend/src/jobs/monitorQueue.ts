import Queue from 'bull';
import redisClient from '../config/redis';
import { MonitorService } from '../services/monitorService';
import config from '../config/config';

// Create monitor queue
export const monitorQueue = new Queue('monitor-checks', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

// Process monitor checks
monitorQueue.process(async (job) => {
  console.log(`Processing monitor check job ${job.id}`);

  const monitorService = new MonitorService();
  await monitorService.checkAllMonitors();

  return { success: true };
});

// Event listeners
monitorQueue.on('completed', (job) => {
  console.log(`✅ Monitor check job ${job.id} completed`);
});

monitorQueue.on('failed', (job, err) => {
  console.error(`❌ Monitor check job ${job.id} failed:`, err);
});

// Schedule recurring job (every 5 minutes)
export const scheduleMonitorChecks = async (): Promise<void> => {
  await monitorQueue.add(
    {},
    {
      repeat: {
        every: config.monitoring.checkInterval,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log(`✅ Monitor checks scheduled (every ${config.monitoring.checkInterval}ms)`);
};

export default monitorQueue;
