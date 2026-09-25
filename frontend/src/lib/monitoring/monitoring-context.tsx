'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ICamera, IDashboardOverview } from './types';
import { monitoringApi } from './monitoring-api';

interface MonitoringContextType {
  organizationId: string;
  setOrganizationId: (id: string) => void;
  cameras: ICamera[];
  loadingCameras: boolean;
  refreshCameras: () => Promise<void>;
  dashboardData: IDashboardOverview | null;
  loadingDashboard: boolean;
  refreshDashboard: () => Promise<void>;
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string | null) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const [organizationId, setOrganizationId] = useState<string>('org_sede_central');
  const [cameras, setCameras] = useState<ICamera[]>([]);
  const [loadingCameras, setLoadingCameras] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<IDashboardOverview | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const refreshCameras = async () => {
    try {
      setLoadingCameras(true);
      const data = await monitoringApi.cameras.list(organizationId);
      setCameras(data || []);
    } catch (err) {
      console.warn('Failed to load cameras, using offline state', err);
      setCameras([]);
    } finally {
      setLoadingCameras(false);
    }
  };

  const refreshDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const data = await monitoringApi.analytics.getDashboard(organizationId);
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load dashboard data', err);
      // Clean zeroed fallback state
      setDashboardData({
        realtime: {
          totalCameras: cameras.length,
          connectedCameras: cameras.filter((c) => c.status === 'online').length,
          disconnectedCameras: cameras.filter((c) => c.status === 'offline').length,
          unconfiguredCameras: cameras.filter((c) => c.status === 'unconfigured').length,
          currentDetectedPersons: 0,
          activeAlertsCount: 0,
        },
        historicalToday: {
          entriesToday: 0,
          exitsToday: 0,
          netTraffic: 0,
          avgDwellMinutes: 0,
          peakHour: 'N/A',
          peakOccupancy: 0,
          eventsTodayCount: 0,
        },
        hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
          hour: `${String(i).padStart(2, '0')}:00`,
          entries: 0,
          exits: 0,
          avgOccupancy: 0,
        })),
        zoneCirculation: [],
        recentEvents: [],
        recentAlerts: [],
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    refreshCameras();
    refreshDashboard();
  }, [organizationId]);

  return (
    <MonitoringContext.Provider
      value={{
        organizationId,
        setOrganizationId,
        cameras,
        loadingCameras,
        refreshCameras,
        dashboardData,
        loadingDashboard,
        refreshDashboard,
        selectedCameraId,
        setSelectedCameraId,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}
