'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface AEConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  itemDetails?: {
    title?: string;
    subtitle?: string;
    badge?: string;
  };
}

export function AEConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar eliminación?',
  description = 'Esta acción no se puede deshacer y la publicación será removida permanentemente.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  itemDetails,
}: AEConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white border border-slate-200 rounded-sm max-w-md w-full shadow-2xl overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-[#0F1D38] px-5 py-3.5 text-white flex items-center justify-between border-b border-[#1E335A]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-500/20 text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Confirmación de Eliminación
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-white rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
            </div>
          </div>

          {itemDetails && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs text-xs space-y-1">
              {itemDetails.title && (
                <p className="font-bold text-slate-800 line-clamp-1">{itemDetails.title}</p>
              )}
              {itemDetails.subtitle && (
                <p className="text-[11px] text-slate-500 line-clamp-1">{itemDetails.subtitle}</p>
              )}
              {itemDetails.badge && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-xs">
                  {itemDetails.badge}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
