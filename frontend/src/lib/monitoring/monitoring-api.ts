import {
  ICamera,
  ICameraConfig,
  ICameraZone,
  IVideoEvent,
  IAlertRule,
  IAlertIncident,
  IDashboardOverview,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || `API error ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const monitoringApi = {
  // Cameras
  cameras: {
    list: (orgId = 'default-org'): Promise<ICamera[]> =>
      fetcher<ICamera[]>(`/monitoring/cameras?organizationId=${encodeURIComponent(orgId)}`),

    get: (id: string): Promise<ICamera> =>
      fetcher<ICamera>(`/monitoring/cameras/${id}`),

    create: (data: {
      organizationId: string;
      name: string;
      location: string;
      description?: string;
      config: ICameraConfig;
      zones?: ICameraZone[];
    }): Promise<ICamera> =>
      fetcher<ICamera>('/monitoring/cameras', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<ICamera>): Promise<ICamera> =>
      fetcher<ICamera>(`/monitoring/cameras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      fetcher<{ success: boolean }>(`/monitoring/cameras/${id}`, {
        method: 'DELETE',
      }),

    testConnection: (config: ICameraConfig): Promise<{
      success: boolean;
      status: string;
      message: string;
      details?: any;
    }> =>
      fetcher('/monitoring/cameras/test-connection', {
        method: 'POST',
        body: JSON.stringify(config),
      }),

    updateZones: (id: string, zones: ICameraZone[]): Promise<ICamera> =>
      fetcher<ICamera>(`/monitoring/cameras/${id}/zones`, {
        method: 'PUT',
        body: JSON.stringify({ zones }),
      }),

    discover: (subnet?: string): Promise<Array<{
      ip: string;
      mac?: string;
      protocol: 'RTSP' | 'ONVIF';
      port: number;
      manufacturer: string;
      model: string;
      name: string;
      rtspPath: string;
      signal?: string;
    }>> =>
      fetcher(`/monitoring/cameras/discover${subnet ? `?subnet=${encodeURIComponent(subnet)}` : ''}`),
  },

  // Events
  events: {
    list: (params?: {
      organizationId?: string;
      cameraId?: string;
      zoneId?: string;
      type?: string;
      severity?: string;
      limit?: number;
    }): Promise<IVideoEvent[]> => {
      const q = new URLSearchParams();
      q.set('organizationId', params?.organizationId || 'default-org');
      if (params?.cameraId) q.set('cameraId', params.cameraId);
      if (params?.zoneId) q.set('zoneId', params.zoneId);
      if (params?.type) q.set('type', params.type);
      if (params?.severity) q.set('severity', params.severity);
      if (params?.limit) q.set('limit', String(params.limit));
      return fetcher<IVideoEvent[]>(`/monitoring/events?${q.toString()}`);
    },

    acknowledge: (id: string): Promise<{ success: boolean }> =>
      fetcher<{ success: boolean }>(`/monitoring/events/${id}/ack`, {
        method: 'PUT',
      }),
  },

  // Alerts
  alerts: {
    listRules: (orgId = 'default-org'): Promise<IAlertRule[]> =>
      fetcher<IAlertRule[]>(`/monitoring/alerts/rules?organizationId=${encodeURIComponent(orgId)}`),

    createRule: (data: Partial<IAlertRule>): Promise<IAlertRule> =>
      fetcher<IAlertRule>('/monitoring/alerts/rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateRule: (id: string, data: Partial<IAlertRule>): Promise<IAlertRule> =>
      fetcher<IAlertRule>(`/monitoring/alerts/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteRule: (id: string): Promise<{ success: boolean }> =>
      fetcher<{ success: boolean }>(`/monitoring/alerts/rules/${id}`, {
        method: 'DELETE',
      }),

    toggleRule: (id: string, enabled: boolean): Promise<{ success: boolean; enabled: boolean }> =>
      fetcher(`/monitoring/alerts/rules/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),

    listIncidents: (orgId = 'default-org', status?: string): Promise<IAlertIncident[]> => {
      const q = new URLSearchParams({ organizationId: orgId });
      if (status) q.set('status', status);
      return fetcher<IAlertIncident[]>(`/monitoring/alerts/incidents?${q.toString()}`);
    },

    updateIncidentStatus: (
      id: string,
      status: 'active' | 'acknowledged' | 'resolved',
    ): Promise<{ success: boolean }> =>
      fetcher(`/monitoring/alerts/incidents/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  // Analytics
  analytics: {
    getDashboard: (orgId = 'default-org'): Promise<IDashboardOverview> =>
      fetcher<IDashboardOverview>(`/monitoring/analytics/dashboard?organizationId=${encodeURIComponent(orgId)}`),
  },
};
