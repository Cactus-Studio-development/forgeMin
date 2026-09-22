'use client';

import React from 'react';

interface OpportunityIconProps {
  className?: string;
  size?: number;
}

export function OpportunityIcon({ className = 'text-current', size = 20 }: OpportunityIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
    >
      {/* Enterprise Discovery Radar / Aperture */}
      <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
      <circle cx="12" cy="12" r="4.5" strokeOpacity="0.8" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default OpportunityIcon;
