'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Mail,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Sparkles,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Contact } from '@/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.opportunity.getContacts();
        if (Array.isArray(res)) setContacts(res);
      } catch (err) {
        console.error('Error loading contacts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, []);

  const handleCopyEmail = (id: string, email?: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Discovered Contacts</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Directorio de contactos públicos extraídos, clasificados por rol y nivel de confianza.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'SALES', 'HR', 'FOUNDER', 'CEO', 'CTO', 'MARKETING', 'GENERAL'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-500 text-sm">Cargando contactos...</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-zinc-800/80 text-zinc-500">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm text-zinc-400">No se encontraron contactos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{contact.name}</h3>
                  <span className="text-xs text-blue-400 block mt-0.5">{contact.companyName || 'Empresa'}</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {!contact.type || contact.type.toUpperCase() === 'UNKNOWN' ? 'GENERAL' : contact.type}
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <p className="line-clamp-1">{contact.role || 'Rol corporativo'}</p>
                {contact.email && (
                  <p className="text-zinc-300 flex items-center gap-1.5 pt-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate">{contact.email}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-500">Confianza: {contact.confidence}</span>
                <div className="flex items-center gap-2">
                  {contact.email && (
                    <button
                      onClick={() => handleCopyEmail(contact.id, contact.email)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Copiar correo"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <a
                    href={`/opportunities/clients`}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
                  >
                    Outreach
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
