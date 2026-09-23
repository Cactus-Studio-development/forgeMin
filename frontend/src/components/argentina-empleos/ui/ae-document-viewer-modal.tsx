'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Download, ExternalLink, X, Loader2 } from 'lucide-react';
import { downloadDocument, getDocumentBlobUrl } from '@/lib/argentina-empleos/file-utils';

interface AEDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function AEDocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}: AEDocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && fileUrl) {
      setLoading(true);
      const url = getDocumentBlobUrl(fileUrl);
      setBlobUrl(url);
      setLoading(false);

      return () => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-sm w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {fileName || 'Documento PDF'}
              </h3>
              <span className="text-[10px] text-slate-500 block">
                Visualizador de Curriculum Vitae
              </span>
            </div>
          </div>

          {/* Action Buttons: Download & Open Tab */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => downloadDocument(fileUrl, fileName)}
              className="px-3 py-1.5 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Descargar archivo a tu equipo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-sm border border-slate-300 transition-colors shadow-2xs"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Nueva Pestaña</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-200 transition-colors"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#106EBE]" />
            </div>
          ) : (
            <iframe
              src={blobUrl}
              title={fileName}
              className="w-full h-full border-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
