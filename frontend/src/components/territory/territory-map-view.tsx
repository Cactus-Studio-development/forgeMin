'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TerritoryLead, BusinessCategory } from '@/types/territory';
import {
  MapPin,
  Phone,
  Globe,
  Compass,
  Crosshair,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Building,
  Store,
  Layers,
  Search,
} from 'lucide-react';

interface TerritoryMapViewProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  leads: TerritoryLead[];
  selectedCategory: BusinessCategory;
  selectedLeadId: string | null;
  onSelectLead: (lead: TerritoryLead) => void;
  onCenterChange: (center: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  onCategoryChange: (category: BusinessCategory) => void;
  onGenerateProposal: (lead: TerritoryLead) => void;
  isLoading: boolean;
}

export function TerritoryMapView({
  center,
  radiusMeters,
  leads,
  selectedCategory,
  selectedLeadId,
  onSelectLead,
  onCenterChange,
  onRadiusChange,
  onCategoryChange,
  onGenerateProposal,
  isLoading,
}: TerritoryMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const circleRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map (Client Side Only)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      // Inject leaflet stylesheet if not present
      if (!document.getElementById('leaflet-css-link')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-link';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Default OpenStreetMap Layer
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Satellite / Aerial Layer (Esri World Imagery - 100% Free, No Key Required)
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      });

      // Modern Topo Layer (Esri World Topo Map - 100% Free, No Key Required)
      const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      });

      L.control.layers({
        'Calles (OpenStreetMap)': osmLayer,
        'Satelital HD (Esri)': satelliteLayer,
        'Topográfico (Esri)': topoLayer,
      }, undefined, { position: 'topright' }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add center drag/click listener
      map.on('moveend', () => {
        const c = map.getCenter();
        onCenterChange({ lat: c.lat, lng: c.lng });
      });

      mapInstanceRef.current = map;
      if (isMounted) setMapReady(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center and radius circle
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Draw / Update radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }

    circleRef.current = L.circle([center.lat, center.lng], {
      color: '#3b82f6',
      fillColor: '#60a5fa',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 6',
      radius: radiusMeters,
    }).addTo(map);
  }, [center, radiusMeters, mapReady]);

  // Update Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    leads.forEach((lead) => {
      const isSelected = selectedLeadId === lead.id;
      const isPharmacy = lead.category === 'pharmacy';
      const isHealth = lead.category === 'health_clinic';
      const isTech = lead.category === 'technology' || lead.category === 'company';

      let markerBg = '#2563eb'; // blue default
      let labelInitial = 'E';
      if (isPharmacy) {
        markerBg = '#059669'; // emerald
        labelInitial = 'F';
      } else if (isHealth) {
        markerBg = '#dc2626'; // red
        labelInitial = 'S';
      } else if (isTech) {
        markerBg = '#7c3aed'; // purple
        labelInitial = 'T';
      } else if (lead.category === 'retail') {
        markerBg = '#d97706'; // amber
        labelInitial = 'C';
      } else if (lead.category === 'gastronomy') {
        markerBg = '#db2777'; // pink
        labelInitial = 'G';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            background: ${markerBg};
            color: white;
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            border: 2px solid white;
            font-size: ${isSelected ? '13px' : '11px'};
            font-weight: 700;
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span>${labelInitial}</span>
            ${isSelected ? '<div style="position:absolute; width:100%; height:100%; border-radius:50%; border:2px solid #2563eb; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>' : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lead.location.lat, lead.location.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 2px;">${lead.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${lead.categoryLabel} • ${lead.location.address || 'Ubicación local'}</div>
          ${lead.contact.phone ? `<div style="font-size: 12px; color: #334155; margin-bottom: 4px;">Tel: <b>${lead.contact.phone}</b></div>` : ''}
          ${lead.openingHours ? `<div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 8px;">Horario: ${lead.openingHours}</div>` : ''}
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button id="btn-prop-${lead.id}" style="
              flex: 1;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">Generar Propuesta IA</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectLead(lead);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-prop-${lead.id}`);
        if (btn) {
          btn.onclick = () => onGenerateProposal(lead);
        }
      });

      markersRef.current[lead.id] = marker;
    });
  }, [leads, selectedLeadId, mapReady]);

  // Center map on user geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada por su navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onCenterChange(newCenter);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newCenter.lat, newCenter.lng], 15, { animate: true, duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Error de geolocalización:', err.message);
      },
      { enableHighAccuracy: true },
    );
  };

  const categories: { id: BusinessCategory; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'pharmacy', label: 'Farmacias' },
    { id: 'company', label: 'Empresas' },
    { id: 'health_clinic', label: 'Salud' },
    { id: 'technology', label: 'Tech & IT' },
    { id: 'retail', label: 'Comercios' },
    { id: 'services', label: 'Servicios' },
    { id: 'gastronomy', label: 'Gastronomía' },
  ];

  return (
    <div className="relative w-full h-full min-h-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md pointer-events-auto overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Range Radius Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md pointer-events-auto">
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Radio:</span>
          {[1000, 3000, 5000, 10000].map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                radiusMeters === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>
      </div>

      {/* Floating GPS Button */}
      <button
        onClick={handleLocateMe}
        title="Centrar en mi ubicación actual"
        className="absolute bottom-6 right-6 z-[500] flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Crosshair className="w-4 h-4" />
        <span>Mi Ubicación</span>
      </button>

      {/* Map Stats Badge */}
      <div className="absolute bottom-6 left-6 z-[500] flex items-center gap-2 px-3.5 py-2 bg-slate-900/85 text-white backdrop-blur-md rounded-xl text-xs font-medium border border-slate-700 shadow-lg pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>
          {isLoading ? 'Escaneando zona...' : `${leads.length} comercios y prospectos en radar`}
        </span>
      </div>

      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-0" />
    </div>
  );
}
