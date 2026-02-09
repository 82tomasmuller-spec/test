import nodemailer from 'nodemailer';
import { Incident, Alert, Monitor, Shop, User } from '../models';
import config from '../config/config';

export class AlertService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.password,
      },
    });
  }

  /**
   * Send alert when incident is detected
   */
  async sendIncidentAlert(incidentId: number): Promise<void> {
    const incident = await Incident.findByPk(incidentId, {
      include: [
        {
          model: Monitor,
          as: 'monitor',
          include: [
            {
              model: Shop,
              as: 'shop',
              include: [
                {
                  model: User,
                  as: 'user',
                },
              ],
            },
          ],
        },
      ],
    });

    if (!incident) {
      console.error(`Incident #${incidentId} not found`);
      return;
    }

    const monitor = incident.monitor as any;
    const shop = monitor.shop as any;
    const user = shop.user as any;

    // Create alert record
    const alert = await Alert.create({
      incidentId: incident.id,
      type: 'email',
      recipient: user.email,
      status: 'pending',
    });

    try {
      // Send email
      await this.transporter.sendMail({
        from: `"${config.email.from.name}" <${config.email.from.email}>`,
        to: user.email,
        subject: `🚨 Výpadek detekován - ${shop.name}`,
        html: this.getIncidentEmailTemplate(incident, monitor, shop),
      });

      // Update alert status
      alert.status = 'sent';
      alert.sentAt = new Date();
      await alert.save();

      console.log(`✅ Alert email sent to ${user.email} for incident #${incident.id}`);
    } catch (error) {
      alert.status = 'failed';
      alert.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await alert.save();

      console.error(`❌ Failed to send alert email for incident #${incident.id}:`, error);
    }
  }

  /**
   * Send alert when incident is resolved
   */
  async sendRecoveryAlert(incidentId: number): Promise<void> {
    const incident = await Incident.findByPk(incidentId, {
      include: [
        {
          model: Monitor,
          as: 'monitor',
          include: [
            {
              model: Shop,
              as: 'shop',
              include: [
                {
                  model: User,
                  as: 'user',
                },
              ],
            },
          ],
        },
      ],
    });

    if (!incident) {
      console.error(`Incident #${incidentId} not found`);
      return;
    }

    const monitor = incident.monitor as any;
    const shop = monitor.shop as any;
    const user = shop.user as any;

    // Create alert record
    const alert = await Alert.create({
      incidentId: incident.id,
      type: 'email',
      recipient: user.email,
      status: 'pending',
    });

    try {
      // Send email
      await this.transporter.sendMail({
        from: `"${config.email.from.name}" <${config.email.from.email}>`,
        to: user.email,
        subject: `✅ Provoz obnoven - ${shop.name}`,
        html: this.getRecoveryEmailTemplate(incident, monitor, shop),
      });

      // Update alert status
      alert.status = 'sent';
      alert.sentAt = new Date();
      await alert.save();

      console.log(`✅ Recovery email sent to ${user.email} for incident #${incident.id}`);
    } catch (error) {
      alert.status = 'failed';
      alert.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await alert.save();

      console.error(`❌ Failed to send recovery email for incident #${incident.id}:`, error);
    }
  }

  /**
   * Email template for incident notification
   */
  private getIncidentEmailTemplate(incident: any, monitor: any, shop: any): string {
    const duration = incident.resolvedAt
      ? this.formatDuration(incident.startedAt, incident.resolvedAt)
      : 'Probíhá';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 20px; margin-top: 20px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Výpadek detekován</h1>
          </div>
          <div class="content">
            <h2>${shop.name}</h2>
            <div class="info">
              <span class="label">URL:</span> ${monitor.url}
            </div>
            <div class="info">
              <span class="label">Čas detekce:</span> ${new Date(incident.startedAt).toLocaleString('cs-CZ')}
            </div>
            <div class="info">
              <span class="label">Chyba:</span> ${incident.errorMessage || 'Neznámá chyba'}
            </div>
            ${incident.httpCode ? `<div class="info"><span class="label">HTTP kód:</span> ${incident.httpCode}</div>` : ''}
            <div class="info">
              <span class="label">Doba odezvy:</span> ${incident.responseTime}ms
            </div>
          </div>
          <div class="footer">
            <p>Toto je automatická notifikace z ShopAlert - E-shop Uptime Guard</p>
            <p>Pro více informací se přihlaste do dashboardu: ${config.frontendUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email template for recovery notification
   */
  private getRecoveryEmailTemplate(incident: any, monitor: any, shop: any): string {
    const duration = incident.resolvedAt
      ? this.formatDuration(incident.startedAt, incident.resolvedAt)
      : 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 20px; margin-top: 20px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Provoz obnoven</h1>
          </div>
          <div class="content">
            <h2>${shop.name}</h2>
            <div class="info">
              <span class="label">URL:</span> ${monitor.url}
            </div>
            <div class="info">
              <span class="label">Výpadek trval:</span> ${duration}
            </div>
            <div class="info">
              <span class="label">Začátek výpadku:</span> ${new Date(incident.startedAt).toLocaleString('cs-CZ')}
            </div>
            <div class="info">
              <span class="label">Konec výpadku:</span> ${new Date(incident.resolvedAt).toLocaleString('cs-CZ')}
            </div>
          </div>
          <div class="footer">
            <p>Toto je automatická notifikace z ShopAlert - E-shop Uptime Guard</p>
            <p>Pro více informací se přihlaste do dashboardu: ${config.frontendUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format duration between two dates
   */
  private formatDuration(start: Date, end: Date): string {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }
}

export default AlertService;
