'use client';

import React from 'react';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  DEFAULT_JOB_CATEGORIES,
} from '@/lib/argentina-empleos/geo-data';
import { Search, MapPin, Filter, RotateCcw } from 'lucide-react';

interface JobFilterBarProps {
  filters: {
    query: string;
    provinceId: string;
    cityId: string;
    modality: string;
    categoryId: string;
  };
  onChange: (updated: Partial<JobFilterBarProps['filters']>) => void;
  onReset: () => void;
}

export function JobFilterBar({ filters, onChange, onReset }: JobFilterBarProps) {
  const cities = getCitiesByProvince(filters.provinceId);

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs mb-5">
      {/* Search Input Row */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Buscar por puesto, profesión, tecnología o empresa (ej: Frontend Developer, Contador, Misiones)..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden transition-all"
        />
      </div>

      {/* Facet Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Province */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Provincia
          </label>
          <select
            value={filters.provinceId}
            onChange={(e) => {
              onChange({ provinceId: e.target.value, cityId: '' });
            }}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          >
            <option value="">Todas las provincias</option>
            {ARGENTINA_PROVINCES.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        {/* City (Cascading dependent) */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Ciudad / Localidad
          </label>
          <select
            value={filters.cityId}
            onChange={(e) => onChange({ cityId: e.target.value })}
            disabled={!filters.provinceId}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 disabled:opacity-50 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          >
            <option value="">
              {filters.provinceId ? 'Todas las ciudades' : 'Elegí provincia primero'}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modality */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Modalidad
          </label>
          <select
            value={filters.modality}
            onChange={(e) => onChange({ modality: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          >
            <option value="">Todas las modalidades</option>
            <option value="Presencial">Presencial</option>
            <option value="Híbrido">Híbrido</option>
            <option value="Remoto">Remoto (Nacional)</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Categoría
          </label>
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          >
            <option value="">Todas las áreas</option>
            {DEFAULT_JOB_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters bar / reset */}
      {(filters.query ||
        filters.provinceId ||
        filters.cityId ||
        filters.modality ||
        filters.categoryId) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Filtros aplicados</span>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-[#106EBE] font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
