import axios, { AxiosError } from 'axios';
import { Monitor, Incident } from '../models';
import config from '../config/config';

interface CheckResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  errorMessage?: string;
}

export class MonitorService {
  /**
   * Check a single URL for availability
   */
  async checkUrl(url: string): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: config.monitoring.requestTimeout,
        validateStatus: (status) => status >= 200 && status < 500, // Don't throw on 4xx
        headers: {
          'User-Agent': 'ShopAlert-Monitor/1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        responseTime,
        errorMessage: response.status >= 400 ? `HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const axiosError = error as AxiosError;

      let errorMessage = 'Unknown error';

      if (axiosError.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
      } else if (axiosError.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found';
      } else if (axiosError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else if (axiosError.response) {
        errorMessage = `HTTP ${axiosError.response.status}`;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      return {
        success: false,
        statusCode: axiosError.response?.status,
        responseTime,
        errorMessage,
      };
    }
  }

  /**
   * Check a monitor and handle incident creation/resolution
   */
  async checkMonitor(monitor: Monitor): Promise<void> {
    console.log(`Checking monitor #${monitor.id} - ${monitor.url}`);

    const result = await this.checkUrl(monitor.url);

    // Update monitor status
    const previousStatus = monitor.status;
    monitor.lastCheck = new Date();
    monitor.lastStatusCode = result.statusCode;
    monitor.lastResponseTime = result.responseTime;
    monitor.status = result.success ? 'up' : 'down';
    await monitor.save();

    // Handle incidents
    if (!result.success) {
      await this.handleDowntime(monitor, result);
    } else if (previousStatus === 'down') {
      await this.handleRecovery(monitor);
    }
  }

  /**
   * Handle downtime - create or update incident
   */
  private async handleDowntime(monitor: Monitor, result: CheckResult): Promise<void> {
    // Check if there's an ongoing incident
    const ongoingIncident = await Incident.findOne({
      where: {
        monitorId: monitor.id,
        status: 'ongoing',
      },
      order: [['startedAt', 'DESC']],
    });

    if (!ongoingIncident) {
      // Create new incident
      const incident = await Incident.create({
        monitorId: monitor.id,
        status: 'ongoing',
        errorMessage: result.errorMessage,
        responseTime: result.responseTime,
        httpCode: result.statusCode,
        startedAt: new Date(),
      });

      console.log(`❌ Incident created #${incident.id} for monitor #${monitor.id}`);

      // Trigger alert (will be implemented in alertService)
      const { AlertService } = await import('./alertService');
      const alertService = new AlertService();
      await alertService.sendIncidentAlert(incident.id);
    } else {
      // Update existing incident
      ongoingIncident.errorMessage = result.errorMessage;
      ongoingIncident.responseTime = result.responseTime;
      ongoingIncident.httpCode = result.statusCode;
      await ongoingIncident.save();

      console.log(`⚠️ Incident #${ongoingIncident.id} still ongoing for monitor #${monitor.id}`);
    }
  }

  /**
   * Handle recovery - resolve incident
   */
  private async handleRecovery(monitor: Monitor): Promise<void> {
    // Find ongoing incident
    const ongoingIncident = await Incident.findOne({
      where: {
        monitorId: monitor.id,
        status: 'ongoing',
      },
      order: [['startedAt', 'DESC']],
    });

    if (ongoingIncident) {
      ongoingIncident.status = 'resolved';
      ongoingIncident.resolvedAt = new Date();
      await ongoingIncident.save();

      console.log(`✅ Incident #${ongoingIncident.id} resolved for monitor #${monitor.id}`);

      // Send recovery notification
      const { AlertService } = await import('./alertService');
      const alertService = new AlertService();
      await alertService.sendRecoveryAlert(ongoingIncident.id);
    }
  }

  /**
   * Check all active monitors
   */
  async checkAllMonitors(): Promise<void> {
    const monitors = await Monitor.findAll({
      where: {
        enabled: true,
      },
    });

    console.log(`Checking ${monitors.length} active monitors...`);

    for (const monitor of monitors) {
      try {
        await this.checkMonitor(monitor);
      } catch (error) {
        console.error(`Error checking monitor #${monitor.id}:`, error);
      }
    }
  }
}

export default MonitorService;
