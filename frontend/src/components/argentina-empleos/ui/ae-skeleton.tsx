'use client';

import React from 'react';

export function AESkeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xs ${className}`}
    />
  );
}

export function AEJobCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <AESkeleton className="h-5 w-48" />
            <AESkeleton className="h-4 w-16 rounded-full" />
          </div>
          <AESkeleton className="h-3.5 w-32" />
        </div>
        <AESkeleton className="h-6 w-24 rounded-xs" />
      </div>

      <div className="flex items-center gap-3">
        <AESkeleton className="h-4 w-28" />
        <AESkeleton className="h-4 w-24" />
        <AESkeleton className="h-4 w-32" />
      </div>

      <AESkeleton className="h-10 w-full" />

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <AESkeleton className="h-4 w-20" />
        <AESkeleton className="h-7 w-28 rounded-sm" />
      </div>
    </div>
  );
}

export function AEJobFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <AEJobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AEWalletSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-3">
          <div className="flex justify-between items-center">
            <AESkeleton className="h-3 w-28" />
            <AESkeleton className="h-6 w-6 rounded-sm" />
          </div>
          <AESkeleton className="h-8 w-36" />
          <AESkeleton className="h-3 w-40" />
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-3">
          <div className="flex justify-between items-center">
            <AESkeleton className="h-3 w-32" />
            <AESkeleton className="h-6 w-6 rounded-sm" />
          </div>
          <AESkeleton className="h-8 w-24" />
          <AESkeleton className="h-3 w-48" />
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-sm p-5 space-y-3">
          <AESkeleton className="h-4 w-28" />
          <AESkeleton className="h-3 w-full" />
          <AESkeleton className="h-8 w-full rounded-sm" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <AESkeleton className="h-4 w-48" />
          <AESkeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="space-y-1.5">
              <AESkeleton className="h-3.5 w-40" />
              <AESkeleton className="h-2.5 w-24" />
            </div>
            <AESkeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AEProfileSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <AESkeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <AESkeleton className="h-5 w-48" />
          <AESkeleton className="h-3.5 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <AESkeleton className="h-3 w-24" />
            <AESkeleton className="h-8 w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
