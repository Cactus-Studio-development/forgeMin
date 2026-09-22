'use client';

import React from 'react';
import Link from 'next/link';
import { AEJob } from '@/lib/argentina-empleos/types';
import {
  MapPin,
  Building,
  Briefcase,
  Clock,
  Bot,
  Shield,
  ArrowRight,
  EyeOff,
  Banknote,
} from 'lucide-react';

interface JobCardProps {
  job: AEJob;
  userProvinceId?: string;
  userCityId?: string;
}

export function JobCard({ job, userProvinceId, userCityId }: JobCardProps) {
  const isNearCity = userCityId && job.cityId && userCityId.toLowerCase() === job.cityId.toLowerCase();
  const isSameProvince =
    userProvinceId &&
    job.provinceId &&
    userProvinceId.toLowerCase() === job.provinceId.toLowerCase();

  return (
    <div className="bg-white border border-slate-200 rounded-sm hover:border-[#0064D9]/60 transition-all p-5 shadow-2xs hover:shadow-xs group relative">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Proximity Match Tag */}
          {isNearCity ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
              <MapPin className="w-3 h-3 text-emerald-600" />
              Cerca de vos ({job.cityName})
            </span>
          ) : isSameProvince ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold">
              <MapPin className="w-3 h-3 text-blue-600" />
              En tu provincia ({job.provinceName})
            </span>
          ) : null}

          {/* Modality Tag */}
          <span
            className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
              job.modality === 'Remoto'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : job.modality === 'Híbrido'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {job.modality}
          </span>

          {/* Category Tag */}
          <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
            {job.categoryName || 'General'}
          </span>

          {/* Anonymous Tag */}
          {job.isAnonymous && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-medium">
              <EyeOff className="w-3 h-3" />
              Anónimo
            </span>
          )}
        </div>

        {/* Date */}
        <span className="text-[11px] text-slate-500 font-medium">
          {job.createdAt
            ? new Date(job.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
              })
            : 'Reciente'}
        </span>
      </div>

      {/* Main Title & Company */}
      <div className="mb-3">
        <Link
          href={`/argentinaEmpleos/trabajos/${job.id}`}
          className="text-base font-bold text-slate-900 group-hover:text-[#106EBE] transition-colors line-clamp-1 block"
        >
          {job.title}
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1">
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{job.company || 'Empresa Confidencial'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.cityName ? `${job.cityName}, ${job.provinceName}` : job.provinceName || 'Argentina'}</span>
          </div>
        </div>
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
        {job.description}
      </p>

      {/* Skills or Requirements Chips */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 text-[10px] font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{job.skills.length - 4} más
            </span>
          )}
        </div>
      )}

      {/* Bottom Bar: Salary + Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Banknote className="w-4 h-4 text-emerald-600" />
          <span>{job.salary || 'Salario a convenir'}</span>
        </div>

        <Link
          href={`/argentinaEmpleos/trabajos/${job.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#106EBE] hover:text-[#005A9E] group-hover:translate-x-0.5 transition-transform"
        >
          <span>Ver oportunidad</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
