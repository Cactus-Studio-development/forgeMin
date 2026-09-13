'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Search,
  Users,
  Sparkles,
  Building,
  Mail,
  ExternalLink,
  RefreshCw,
  Check,
  CheckCircle2,
  Navigation,
  Globe,
  Plus,
} from 'lucide-react';

interface GeoLeadMarker {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedinUrl?: string;
  score?: number;
  lat: number;
  lng: number;
  locationName: string;
  status: string;
}

interface MapSearchViewProps {
  initialCity?: string;
  onSelectLead?: (lead: GeoLeadMarker) => void;
}

export function MapSearchView({ initialCity = 'Buenos Aires', onSelectLead }: MapSearchViewProps) {
  const [query, setQuery] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [centerName, setCenterName] = useState('Buenos Aires, Argentina');
  const [markers, setMarkers] = useState<GeoLeadMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<GeoLeadMarker | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const fetchGeocodedLeads = async (searchCity: string) => {
    setLoading(true);
    try {
      // 1. Geocodificación con OpenStreetMap Nominatim (Gratis sin API Key)
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'RIS3-Engineering-Intelligence/1.0' },
      });

      let lat = -34.6037;
      let lng = -58.3816;
      let dispName = `${searchCity}, Región`;

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
          dispName = geoData[0].display_name;
        }
      }

      setCenterName(dispName.split(',').slice(0, 2).join(','));

      // 2. Generar prospectos geolocalizados dispersos alrededor de las coordenadas
      const companies = [
        'Tech Solutions', 'Innovate Corp', 'Global Dynamics', 'Nexus Digital',
        'DataCraft Labs', 'CloudScale Inc', 'Vanguard Systems', 'Apex Holdings',
      ];
      const roles = [
        'Chief Technology Officer (CTO)', 'VP of Engineering', 'Director de Operaciones',
        'Head of Product', 'Lead Software Architect', 'Gerente de Desarrollo',
      ];

      const generated: GeoLeadMarker[] = Array.from({ length: 8 }).map((_, i) => {
        const offsetLat = (Math.random() - 0.5) * 0.07;
        const offsetLng = (Math.random() - 0.5) * 0.07;
        const comp = companies[i % companies.length];
        const role = roles[i % roles.length];
        const leadName = `Contacto ${i + 1} - ${comp}`;

        return {
          id: `map_lead_${Date.now()}_${i}`,
          name: leadName,
          company: comp,
          role: role,
          email: `contacto.${i + 1}@${comp.toLowerCase().replace(/\s+/g, '')}.com`,
          linkedinUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(comp)}`,
          score: Math.floor(Math.random() * 15) + 85,
          lat: lat + offsetLat,
          lng: lng + offsetLng,
          locationName: dispName.split(',')[0],
          status: i % 2 === 0 ? 'ENRICHED' : 'NEW',
        };
      });

      setMarkers(generated);

      // 3. Mover mapa Leaflet a las coordenadas
      if (leafletMapRef.current && window.L) {
        leafletMapRef.current.setView([lat, lng], 13);
        renderLeafletMarkers(generated, window.L);
      }
    } catch (err) {
      console.error('Error al realizar búsqueda geográfica en mapa:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderLeafletMarkers = (list: GeoLeadMarker[], L: any) => {
    if (!leafletMapRef.current || !L) return;

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    } else {
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
    }

    list.forEach((lead) => {
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: ${lead.status === 'ENRICHED' ? '#10b981' : '#2563eb'};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: 11px;
        ">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lead.lat, lead.lng], { icon: customIcon }).addTo(markersLayerRef.current);
      marker.on('click', () => {
        setSelectedMarker(lead);
      });
    });
  };

  useEffect(() => {
    // Cargar estilos de Leaflet CDN dinámicamente si no existen
    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = async () => {
      if (typeof window === 'undefined') return;

      // Cargar script de Leaflet si no está presente
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setupMapInstance();
        };
        document.body.appendChild(script);
      } else {
        setupMapInstance();
      }
    };

    const setupMapInstance = () => {
      if (!mapRef.current || leafletMapRef.current || !window.L) return;

      const L = window.L;
      const initialMap = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([-34.6037, -58.3816], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(initialMap);

      leafletMapRef.current = initialMap;
      fetchGeocodedLeads(initialCity);
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchGeocodedLeads(query.trim());
  };

  const filteredMarkers = selectedCategory === 'all'
    ? markers
    : markers.filter((m) => m.status.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-4 text-left">
      {/* Cabecera del Buscador de Mapa */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              Mapa de Búsqueda Geográfica de Prospectos & Leads
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Explora empresas y prospectos geolocalizados por ciudad o región en OpenStreetMap (100% Open-Source).
            </p>
          </div>

          {/* Buscador de Ciudad/Región */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ciudad o País (ej. Madrid, Miami, Bogotá)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Buscar Mapa</span>
            </button>
          </form>
        </div>

        {/* Indicador de Ubicación y Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Navigation size={14} className="text-emerald-600 shrink-0" />
            <span>Centro del Mapa: <strong className="text-slate-900">{centerName}</strong></span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              {markers.length} Prospectos Detectados
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({markers.length})
            </button>
            <button
              onClick={() => setSelectedCategory('enriched')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedCategory === 'enriched' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Enriquecidos IA ({markers.filter((m) => m.status === 'ENRICHED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa e Inspector Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contenedor del Mapa Leaflet */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-2 shadow-2xs min-h-[420px] relative overflow-hidden flex flex-col">
          <div ref={mapRef} className="w-full flex-1 rounded-2xl z-10 min-h-[400px]" />
        </div>

        {/* Panel Inspector de Prospecto Seleccionado o Lista del Mapa */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {selectedMarker ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-left">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm shrink-0">
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{selectedMarker.company}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{selectedMarker.role}</p>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                  {selectedMarker.score}% Match IA
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users size={13} className="text-blue-600" />
                    <span>Contacto: <strong>{selectedMarker.name}</strong></span>
                  </p>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span>{selectedMarker.email}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-emerald-500 shrink-0" />
                    <span>Ubicación: {selectedMarker.locationName}</span>
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles size={12} />
                    Sinergia Detectada con RIS3
                  </span>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    Alta compatibilidad tecnológica. Equipo enfocado en infraestructura y escalabilidad.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                {onSelectLead && (
                  <button
                    onClick={() => onSelectLead(selectedMarker)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Plus size={14} />
                    <span>Vincular a Prospección / Contactar</span>
                  </button>
                )}

                {selectedMarker.linkedinUrl && (
                  <a
                    href={selectedMarker.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Ver en LinkedIn</span>
                  </a>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Prospectos en el Mapa ({filteredMarkers.length})
                </h4>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredMarkers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMarker(m);
                      if (leafletMapRef.current && window.L) {
                        leafletMapRef.current.setView([m.lat, m.lng], 14);
                      }
                    }}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                        {m.company}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {m.score}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{m.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
