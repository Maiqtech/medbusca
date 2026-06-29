import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, CheckCircle2, Building2, MapPin, Users, Trash2, UserPlus, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { municipiosApi, usuariosApi } from '../../../services/api';

interface Props {
  municipio: any | null;
  onClose: () => void;
  onUpdated: () => void;
  onAddManager?: (municipioId: number | string, municipioNome: string) => void;
}

export default function MunicipalityEditModal({ municipio, onClose, onUpdated, onAddManager }: Props) {
  const [aba, setAba] = useState<'dados' | 'gestores'>('dados');

  // --- aba dados ---
  const [form, setForm] = useState({ nome: '', uf: '', logo_url: '', ativo: true });
  const [isSaving, setIsSaving] = useState(false);
  const [erroSave, setErroSave] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // --- aba gestores ---
  const [gestores, setGestores] = useState<any[]>([]);
  const [loadingGestores, setLoadingGestores] = useState(false);
  const [erroGestores, setErroGestores] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<any | null>(null);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    if (!municipio) return;
    setAba('dados');
    setForm({
      nome: municipio.nome ?? '',
      uf: municipio.uf ?? '',
      logo_url: municipio.logo_url ?? '',
      ativo: municipio.ativo ?? true,
    });
    setErroSave(null);
    setSucesso(false);
    setGestores([]);
    setErroGestores(null);
    setConfirmando(null);
  }, [municipio?.id]);

  useEffect(() => {
    if (aba !== 'gestores' || !municipio) return;
    setLoadingGestores(true);
    usuariosApi
      .listar({ perfil: 'gestor_municipal', municipio_id: municipio.id })
      .then(setGestores)
      .catch(() => setErroGestores('Erro ao carregar gestores.'))
      .finally(() => setLoadingGestores(false));
  }, [aba, municipio?.id]);

  const handleSave = async () => {
    if (!municipio) return;
    if (!form.nome.trim() || !form.uf.trim()) { setErroSave('Nome e UF são obrigatórios.'); return; }
    setIsSaving(true);
    setErroSave(null);
    try {
      await municipiosApi.atualizar(municipio.id, {
        nome: form.nome.trim(),
        uf: form.uf.trim().toUpperCase(),
        logo_url: form.logo_url.trim() || null,
        ativo: form.ativo,
      });
      setSucesso(true);
      onUpdated();
      setTimeout(onClose, 1200);
    } catch {
      setErroSave('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemover = async () => {
    if (!confirmando) return;
    setRemovendo(true);
    try {
      await usuariosApi.desativar(confirmando.id);
      setGestores(prev => prev.filter(g => g.id !== confirmando.id));
      setConfirmando(null);
      onUpdated();
    } catch {
      setErroGestores('Erro ao remover gestor.');
    } finally {
      setRemovendo(false);
    }
  };

  return (
    <AnimatePresence>
      {municipio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 overflow-hidden shrink-0">
                  {municipio.logo_url ? (
                    <img src={municipio.logo_url} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <MapPin size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-lg leading-tight">{municipio.nome}</h2>
                  <p className="text-xs text-slate-400 font-medium">{municipio.uf} · {municipio.total_upas} UPAs · {municipio.total_gestores} Gestores</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0 px-6">
              {([['dados', MapPin, 'Dados'], ['gestores', Users, 'Gestores']] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setAba(key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                    aba === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {aba === 'dados' && (
                <div className="space-y-5">
                  {/* Logo preview */}
                  {form.logo_url && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={form.logo_url} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium truncate">Prévia do logo</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                      <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        placeholder="Nome do município" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UF</label>
                      <input type="text" value={form.uf}
                        onChange={e => setForm(f => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                        maxLength={2}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all uppercase"
                        placeholder="BA" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL do Logo</label>
                    <input type="url" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      placeholder="https://..." />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[['UPAs', municipio.total_upas ?? 0], ['Gestores', municipio.total_gestores ?? 0], ['Médicos', municipio.total_medicos ?? 0]].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                        <p className="text-lg font-black text-slate-800">{value}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Status</p>
                      <p className="text-xs text-slate-400 font-medium">Municípios inativos ficam ocultos no portal público</p>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.ativo ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  {erroSave && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                      <AlertCircle size={16} className="shrink-0" />{erroSave}
                    </div>
                  )}
                  {sucesso && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-medium">
                      <CheckCircle2 size={16} className="shrink-0" />Salvo com sucesso!
                    </div>
                  )}
                </div>
              )}

              {aba === 'gestores' && (
                <div className="space-y-4">
                  {onAddManager && (
                    <button
                      onClick={() => { onClose(); onAddManager(municipio.id, municipio.nome); }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <UserPlus size={16} />
                      Novo Gestor Municipal
                    </button>
                  )}

                  {loadingGestores ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="text-sm font-medium">Carregando gestores...</span>
                    </div>
                  ) : erroGestores ? (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                      <AlertCircle size={16} className="shrink-0" />{erroGestores}
                    </div>
                  ) : gestores.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Users size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="font-bold text-sm">Nenhum gestor cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gestores.map(g => (
                        <div key={g.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{g.nome}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail size={10} />{g.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmando(g)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confirmação remoção */}
                  <AnimatePresence>
                    {confirmando && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                        <p className="text-sm font-bold text-red-700">Remover <span className="font-black">{confirmando.nome}</span>?</p>
                        <p className="text-xs text-red-500">O acesso deste gestor será desativado imediatamente.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmando(null)}
                            className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-100 transition-all">
                            Cancelar
                          </button>
                          <button onClick={handleRemover} disabled={removendo}
                            className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                            {removendo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Remover
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer — só na aba dados */}
            {aba === 'dados' && (
              <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0 border-t border-slate-100">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={isSaving || sucesso}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
