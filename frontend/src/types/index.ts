export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Shop {
  id: number;
  userId: number;
  name: string;
  domain: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  monitors?: Monitor[];
}

export interface Monitor {
  id: number;
  shopId: number;
  url: string;
  checkInterval: number;
  enabled: boolean;
  lastCheck?: string;
  status: 'up' | 'down' | 'unknown';
  lastStatusCode?: number;
  lastResponseTime?: number;
  createdAt: string;
  updatedAt: string;
  shop?: Shop;
  incidents?: Incident[];
}

export interface Incident {
  id: number;
  monitorId: number;
  status: 'ongoing' | 'resolved';
  errorMessage?: string;
  responseTime?: number;
  httpCode?: number;
  startedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  monitor?: Monitor;
}

export interface Alert {
  id: number;
  incidentId: number;
  type: 'email' | 'sms' | 'webhook' | 'telegram';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  uptime: number;
  incidents: number;
  totalDowntimeMinutes: number;
  period: string;
}

export interface ResponseTimeStats {
  average: number;
  min: number;
  max: number;
  data: {
    timestamp: string;
    responseTime: number;
  }[];
}

export interface Overview {
  totalShops: number;
  totalMonitors: number;
  activeIncidents: number;
  recentIncidents: number;
  monitorsUp: number;
  monitorsDown: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}
