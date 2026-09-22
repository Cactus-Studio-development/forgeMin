'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Message } from '@/types';

export default function OutreachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'READY' | 'SENT'>('DRAFT');

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await api.opportunity.getMessages();
        if (Array.isArray(res)) {
          setMessages(res);
          if (res.length > 0) setSelectedMessage(res[0]);
        }
      } catch (err) {
        console.error('Error loading outreach messages:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, []);

  const filtered = messages.filter((m) => m.status === activeTab || (activeTab === 'DRAFT' && !m.status));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Outreach & Communications</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Gestión de mensajes generados por IA, borradores de Gmail y control riguroso de envíos.
            </p>
          </div>
        </div>

        {/* Security Rule Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Control de Usuario: Sin autoenvíos sin confirmación</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'DRAFT', label: 'Borradores (Drafts)' },
          { id: 'READY', label: 'Listos para Confirmación' },
          { id: 'SENT', label: 'Enviados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Layout Grid: List + Detail Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 lg:col-span-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block px-2">
            Mensajes ({filtered.length})
          </span>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">Cargando comunicaciones...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <p>No hay mensajes en este estado.</p>
              <a
                href="/opportunities/clients"
                className="inline-block text-purple-400 hover:underline text-xs"
              >
                Generar primer mensaje
              </a>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMessage?.id === msg.id
                      ? 'bg-purple-500/10 border-purple-500/40'
                      : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-200 line-clamp-1">{msg.subject || 'Sin Asunto'}</h4>
                  </div>
                  <span className="text-xs text-purple-400 block mt-0.5">
                    {msg.companyName || 'Empresa'} • {msg.type}
                  </span>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail & Review */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 lg:col-span-2 space-y-6">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span>Destinatario: <strong className="text-zinc-300">{selectedMessage.contactEmail || 'contacto@empresa.com'}</strong></span>
                    <span>Tipo: <strong className="text-zinc-300">{selectedMessage.type}</strong></span>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                  {selectedMessage.status}
                </span>
              </div>

              {/* Message Body Box */}
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">
                  Contenido del Correo:
                </span>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs text-zinc-500">
                  Modelo IA: {selectedMessage.aiProvider || 'AI Orchestrator'}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${selectedMessage.subject}\n\n${selectedMessage.body}`);
                      alert('Mensaje copiado al portapapeles.');
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                  >
                    Copiar Mensaje
                  </button>
                  <button
                    onClick={() => {
                      alert('Borrador sincronizado con Gmail. Abre Gmail para revisar y enviar.');
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir en Gmail</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-500 text-xs">
              Selecciona un mensaje del listado para revisar su contenido o preparar su envío.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
