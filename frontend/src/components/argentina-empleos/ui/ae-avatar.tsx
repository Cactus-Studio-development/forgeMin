'use client';

import React from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { AEUser } from '@/lib/argentina-empleos/types';

interface AEAvatarProps {
  user?: {
    name?: string;
    photoUrl?: string;
    role?: string;
    userType?: any;
    [key: string]: any;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export function AEAvatar({
  user,
  size = 'md',
  showBadge = true,
  className = '',
}: AEAvatarProps) {
  const isSuperadmin = user?.role === 'superadmin';

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-2xl',
  };

  const badgeSizeClasses = {
    sm: 'w-3 h-3 -bottom-0.5 -right-0.5',
    md: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    lg: 'w-5 h-5 -bottom-1 -right-1',
    xl: 'w-6 h-6 -bottom-1 -right-1',
  };

  const badgeIconSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const userIconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const superadminIconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      {isSuperadmin ? (
        // Official Corporate Superadmin Avatar Illustration (Never personal Google photo)
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-[#051937] via-[#0A3D78] to-[#0050B3] text-white flex items-center justify-center font-black uppercase shadow-sm border-2 border-white ring-2 ring-amber-400/70 overflow-hidden`}
          title="Superadministrador Oficial — Argentina Empleos"
        >
          {/* Official Executive Emblem SVG */}
          <svg
            className={`${superadminIconSizes[size]} text-amber-300 drop-shadow-xs`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Crown / Star Crest */}
            <path d="M12 2L14.2 6.8L19.5 7.5L15.6 11.2L16.6 16.5L12 14L7.4 16.5L8.4 11.2L4.5 7.5L9.8 6.8L12 2Z" fill="#FBBF24" opacity="0.9" />
            {/* Executive Torso / Shield */}
            <path d="M12 14C8.7 14 6 16.7 6 20C6 20.6 6.4 21 7 21H17C17.6 21 18 20.6 18 20C18 16.7 15.3 14 12 14Z" fill="#FFFFFF" />
            <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
          </svg>
        </div>
      ) : user?.photoUrl ? (
        // Standard User Photo (Google or Uploaded)
        <div
          className={`${sizeClasses[size]} rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold uppercase shadow-xs overflow-hidden border-2 border-white`}
        >
          <img
            src={user.photoUrl}
            alt={user.name || 'Usuario'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Graceful fallback on broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        // Standard User Initials or Scaled Icon
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#106EBE] to-[#0047A5] text-white flex items-center justify-center font-bold uppercase shadow-xs border-2 border-white`}
        >
          {user?.name && user.name.trim() !== 'Usuario' && user.name.trim() !== '' ? (
            <span>{user.name.trim().charAt(0).toUpperCase()}</span>
          ) : (
            <User className={`${userIconSizes[size]} text-white/90`} />
          )}
        </div>
      )}

      {/* Official Verification Badge for Superadmin */}
      {showBadge && isSuperadmin && (
        <div
          className={`absolute ${badgeSizeClasses[size]} rounded-full bg-amber-500 border-2 border-white text-white flex items-center justify-center shadow-xs ring-1 ring-amber-600/30`}
          title="Verificado Superadmin"
        >
          <ShieldCheck className={badgeIconSizes[size]} />
        </div>
      )}
    </div>
  );
}

