import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

async function fetchTokens(): Promise<ApiToken[]> {
  const res = await fetch(`${API_URL}/api/workspace/tokens`, { credentials: 'include' });
  const data = await res.json();
  return data.data || [];
}

async function createToken(name: string): Promise<ApiToken> {
  const res = await fetch(`${API_URL}/api/workspace/tokens`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.data;
}

async function revokeToken(id: string): Promise<void> {
  await fetch(`${API_URL}/api/workspace/tokens/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchTokens().then(setTokens).finally(() => setLoading(false));
  }, [open]);

  async function handleCreate() {
    setCreating(true);
    try {
      const token = await createToken('Punakawan AI');
      setTokens(prev => [token, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    await revokeToken(id);
    setTokens(prev => prev.filter(t => t.id !== id));
  }

  function handleCopy(token: string, id: string) {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a38]">
                <h2 className="text-[14px] font-medium text-[#e0e0f0]">Settings</h2>
                <button
                  onClick={onClose}
                  className="text-[#4a4a58] hover:text-[#808090] transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[12px] font-medium text-[#c0c0d0]">API Token</h3>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="text-[11px] px-2.5 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded-md transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Generating...' : '+ Generate Token'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#4a4a58] mb-3">
                    *Hanya untuk pengguna tertentu. Jangan bagikan token ini kepada siapapun.
                  </p>

                  {loading ? (
                    <div className="text-[11px] text-[#4a4a58] py-4 text-center">Memuat...</div>
                  ) : tokens.length === 0 ? (
                    <div className="text-[11px] text-[#4a4a58] py-4 text-center border border-dashed border-[#2a2a38] rounded-lg">
                      Belum ada token. Buat token untuk menghubungkan Punakawan AI.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tokens.map(t => (
                        <div key={t.id} className="bg-[#12121a] border border-[#2a2a38] rounded-lg px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-[#c0c0d0]">{t.name}</span>
                            <button
                              onClick={() => handleRevoke(t.id)}
                              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-[10px] text-[#4a4a58] font-mono bg-[#0a0a12] px-2 py-1 rounded truncate">
                              {t.token}
                            </code>
                            <button
                              onClick={() => handleCopy(t.token, t.id)}
                              className="text-[10px] px-2 py-1 bg-[#2a2a38] hover:bg-[#3a3a48] text-[#808090] rounded transition-colors shrink-0"
                            >
                              {copiedId === t.id ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                          {t.lastUsedAt && (
                            <p className="text-[10px] text-[#4a4a58] mt-1">
                              Last used: {new Date(t.lastUsedAt).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* How to use */}
                <div className="mt-4 p-3 bg-[#12121a] border border-[#2a2a38] rounded-lg">
                  <p className="text-[11px] font-medium text-[#c0c0d0] mb-1.5">Cara pakai di Punakawan AI</p>
                  <p className="text-[10px] text-[#4a4a58] font-mono">/taskflow tf_xxxxx...</p>
                  <p className="text-[10px] text-[#4a4a58] mt-1">Kirim perintah di atas ke Punakawan AI via Telegram.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
