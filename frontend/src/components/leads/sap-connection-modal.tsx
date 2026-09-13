'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Check, ShieldCheck, RefreshCw, Server, User, Key, Building2 } from 'lucide-react';

interface SapConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedStatusChange?: (isConnected: boolean) => void;
}

export function SapConnectionModal({ isOpen, onClose, onConnectedStatusChange }: SapConnectionModalProps) {
  const [serverUrl, setServerUrl] = useState('https://my-sap-instance.s4hana.cloud.sap');
  const [companyDb, setCompanyDb] = useState('S4HANA_PROD_DB');
  const [username, setUsername] = useState('RIS3_INTEGRATION_USER');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedConnected = localStorage.getItem('sap_connected') === 'true';
    const savedUrl = localStorage.getItem('sap_server_url');
    const savedUser = localStorage.getItem('sap_username');
    if (savedConnected) {
      setIsConnected(true);
      if (savedUrl) setServerUrl(savedUrl);
      if (savedUser) setUsername(savedUser);
    }
  }, []);

  const handleTestAndSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('http://localhost:3001/api/v1/sap/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          companyDb,
          username,
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsConnected(true);
        localStorage.setItem('sap_connected', 'true');
        localStorage.setItem('sap_server_url', serverUrl);
        localStorage.setItem('sap_username', username);
        setStatusMessage({ type: 'success', text: data.message || '¡Conexión verificada con SAP ERP!' });
        if (onConnectedStatusChange) onConnectedStatusChange(true);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Error al conectar con SAP ERP' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'No se pudo contactar al servidor de backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('sap_connected');
    localStorage.removeItem('sap_server_url');
    localStorage.removeItem('sap_username');
    setIsConnected(false);
    setStatusMessage({ type: 'success', text: 'Conexión con SAP desvinculada.' });
    if (onConnectedStatusChange) onConnectedStatusChange(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-left"
        >
          {/* Cabecera modal con estilo azul corporativo SAP */}
          <div className="bg-gradient-to-r from-[#003875] via-[#005bb5] to-[#0070F2] p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Database size={20} className="text-blue-200" />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  Integración SAP ERP
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  S4/HANA & Business One OData Connector
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formulario de conexión */}
          <form onSubmit={handleTestAndSaveConnection} className="p-6 space-y-4">
            {isConnected && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>SAP ERP Conectado & Activo</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Server size={14} className="text-[#0070F2]" />
                  <span>URL del Servidor SAP (Service Layer / OData API)</span>
                </label>
                <input
                  type="text"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://my-sap-instance.s4hana.cloud.sap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F2] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-500" />
                    <span>Company DB / Tenant</span>
                  </label>
                  <input
                    type="text"
                    value={companyDb}
                    onChange={(e) => setCompanyDb(e.target.value)}
                    placeholder="S4HANA_PROD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F2] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                    <User size={14} className="text-slate-500" />
                    <span>Usuario SAP</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="SAP_API_USER"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F2] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Key size={14} className="text-slate-500" />
                  <span>Contraseña o Token OAuth2</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F2] transition-all"
                />
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#0070F2] hover:bg-[#005bb5] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                <span>Probar y Guardar Conexión</span>
              </button>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                >
                  Desvincular
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
