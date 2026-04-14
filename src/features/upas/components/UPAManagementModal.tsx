import { useEffect, useState } from 'react';
import { AlertCircle, Building2, Loader2, Mail, MapPin, Save, Shield, Trash2, UserPlus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { upasApi, usuariosApi } from '../../../services/api';
import MapPicker from '../../../shared/components/MapPicker';

interface UPAManagementModalProps {
  upaId: number | string | null;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
}

interface GestorFormData {
  nome: string;
  email: string;
}

interface UPAFormData {
  nome: string;
  bairro: string;
  endereco: string;
  municipio: number | string;
  latitude: string;
  longitude: string;
  ativa: boolean;
}

const EMPTY_GESTOR_FORM: GestorFormData = {
  nome: '',
  email: '',
};

const EMPTY_UPA_FORM: UPAFormData = {
  nome: '',
  bairro: '',
  endereco: '',
  municipio: '',
  latitude: '',
  longitude: '',
  ativa: true,
};

function parseCoordinate(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function UPAManagementModal({ upaId, onClose, onUpdated }: UPAManagementModalProps) {
  const [upa, setUpa] = useState<any>(null);
  const [gestores, setGestores] = useState<any[]>([]);
  const [upaForm, setUpaForm] = useState<UPAFormData>(EMPTY_UPA_FORM);
  const [novoGestor, setNovoGestor] = useState<GestorFormData>(EMPTY_GESTOR_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingGestor, setIsSavingGestor] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroGestor, setErroGestor] = useState<string | null>(null);

  useEffect(() => {
    if (!upaId) return;

    let ativo = true;
    setIsLoading(true);
    setErro(null);

    Promise.all([
      upasApi.buscar(upaId),
      usuariosApi.listar({ perfil: 'gestor_upa', upa_id: upaId }),
    ])
      .then(([upaData, gestoresData]) => {
        if (!ativo) return;
        setUpa(upaData);
        setGestores(gestoresData);
        setUpaForm({
          nome: upaData.nome || '',
          bairro: upaData.bairro || '',
          endereco: upaData.endereco || '',
          municipio: upaData.municipio || '',
          latitude: upaData.latitude ? String(upaData.latitude) : '',
          longitude: upaData.longitude ? String(upaData.longitude) : '',
          ativa: Boolean(upaData.ativa),
        });
      })
      .catch((error: any) => {
        if (!ativo) return;
        setErro(error.message || 'Erro ao carregar os detalhes da UPA.');
      })
      .finally(() => {
        if (ativo) setIsLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [upaId]);

  if (!upaId) return null;

  const refreshParent = async () => {
    if (onUpdated) await onUpdated();
  };

  const handleSaveUpa = async () => {
    if (!upa) return;
    setErro(null);
    setIsSaving(true);
    try {
      const updated = await upasApi.atualizar(upa.id, {
        nome: upaForm.nome.trim(),
        bairro: upaForm.bairro.trim(),
        endereco: upaForm.endereco.trim(),
        municipio: upaForm.municipio,
        latitude: upaForm.latitude || null,
        longitude: upaForm.longitude || null,
        ativa: upaForm.ativa,
      });
      setUpa(updated);
      await refreshParent();
    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar a UPA.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAtiva = async () => {
    if (!upa) return;
    setErro(null);
    setIsSaving(true);
    try {
      const updated = await upasApi.atualizar(upa.id, {
        nome: upaForm.nome.trim(),
        bairro: upaForm.bairro.trim(),
        endereco: upaForm.endereco.trim(),
        municipio: upaForm.municipio,
        latitude: upaForm.latitude || null,
        longitude: upaForm.longitude || null,
        ativa: !upaForm.ativa,
      });
      setUpa(updated);
      setUpaForm(prev => ({ ...prev, ativa: updated.ativa }));
      await refreshParent();
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar o status da UPA.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGestor = async () => {
    if (!upa || !novoGestor.nome.trim() || !novoGestor.email.trim()) {
      setErroGestor('Informe nome e e-mail do novo gestor.');
      return;
    }

    setErroGestor(null);
    setIsSavingGestor(true);
    try {
      await usuariosApi.criar({
        nome: novoGestor.nome.trim(),
        email: novoGestor.email.trim(),
        perfil: 'gestor_upa',
        municipio: upa.municipio,
        upa: upa.id,
      });
      const gestoresAtualizados = await usuariosApi.listar({ perfil: 'gestor_upa', upa_id: upa.id });
      setGestores(gestoresAtualizados);
      setNovoGestor(EMPTY_GESTOR_FORM);
    } catch (error: any) {
      setErroGestor(error.message || 'Erro ao adicionar gestor.');
    } finally {
      setIsSavingGestor(false);
    }
  };

  const handleRemoveGestor = async (gestor: any) => {
    if (!confirm(`Remover o acesso de ${gestor.nome}?`)) return;
    setErroGestor(null);
    setIsSavingGestor(true);
    try {
      await usuariosApi.desativar(gestor.id);
      setGestores(prev => prev.filter(item => item.id !== gestor.id));
    } catch (error: any) {
      setErroGestor(error.message || 'Erro ao remover gestor.');
    } finally {
      setIsSavingGestor(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !isSaving && !isSavingGestor && onClose()}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100"
          onClick={event => event.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4 z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Gestao da UPA</p>
              <h3 className="text-2xl font-black text-slate-800">{upa?.nome || 'Detalhes da UPA'}</h3>
              {upa && (
                <p className="text-sm text-slate-500">
                  {upa.bairro || 'Sem bairro'} • {upa.total_medicos || 0} medicos • {upa.em_atendimento || 0} em atendimento
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {erro && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                <AlertCircle size={18} className="shrink-0" />
                {erro}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
                <span className="font-medium">Carregando detalhes da UPA...</span>
              </div>
            ) : (
              <>
                <section className="grid lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <p className={`mt-2 text-lg font-black ${upaForm.ativa ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {upaForm.ativa ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medicos</p>
                    <p className="mt-2 text-lg font-black text-slate-800">{upa?.total_medicos || 0}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gestores</p>
                    <p className="mt-2 text-lg font-black text-slate-800">{gestores.length}</p>
                  </div>
                </section>

                <section className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-slate-400" />
                      <h4 className="font-black text-slate-800">Dados da Unidade</h4>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Nome</label>
                      <input
                        type="text"
                        value={upaForm.nome}
                        onChange={event => setUpaForm(prev => ({ ...prev, nome: event.target.value }))}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Bairro</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={upaForm.bairro}
                          onChange={event => setUpaForm(prev => ({ ...prev, bairro: event.target.value }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Endereco</label>
                      <textarea
                        value={upaForm.endereco}
                        onChange={event => setUpaForm(prev => ({ ...prev, endereco: event.target.value }))}
                        rows={3}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Localizacao no Mapa</label>
                      <MapPicker
                        latitude={parseCoordinate(upaForm.latitude)}
                        longitude={parseCoordinate(upaForm.longitude)}
                        onChange={(lat, lng) =>
                          setUpaForm(prev => ({
                            ...prev,
                            latitude: String(lat),
                            longitude: String(lng),
                          }))
                        }
                        onAddressFound={({ endereco, bairro }) =>
                          setUpaForm(prev => ({
                            ...prev,
                            endereco: endereco || prev.endereco,
                            bairro: bairro || prev.bairro,
                          }))
                        }
                        disabled={isSaving}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Latitude</label>
                        <input
                          type="text"
                          value={upaForm.latitude}
                          onChange={event => setUpaForm(prev => ({ ...prev, latitude: event.target.value }))}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Longitude</label>
                        <input
                          type="text"
                          value={upaForm.longitude}
                          onChange={event => setUpaForm(prev => ({ ...prev, longitude: event.target.value }))}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveUpa}
                        disabled={isSaving}
                        className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:bg-blue-400 flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Salvando...' : 'Salvar UPA'}
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleAtiva}
                        disabled={isSaving}
                        className={`py-4 rounded-2xl font-black transition-all ${
                          upaForm.ativa
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {upaForm.ativa ? 'Desativar UPA' : 'Ativar UPA'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Shield size={18} className="text-slate-400" />
                      <h4 className="font-black text-slate-800">Gestores da UPA</h4>
                    </div>

                    <div className="space-y-3">
                      {gestores.length > 0 ? (
                        gestores.map(gestor => (
                          <div key={gestor.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-800">{gestor.nome}</p>
                              <p className="text-xs text-slate-400 font-medium">{gestor.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGestor(gestor)}
                              disabled={isSavingGestor}
                              className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center disabled:opacity-60"
                              title="Remover gestor"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
                          Nenhum gestor de UPA cadastrado para esta unidade.
                        </div>
                      )}
                    </div>

                    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserPlus size={18} className="text-slate-400" />
                        <h5 className="font-black text-slate-800">Adicionar gestor</h5>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nome</label>
                        <input
                          type="text"
                          value={novoGestor.nome}
                          onChange={event => setNovoGestor(prev => ({ ...prev, nome: event.target.value }))}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">E-mail</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={novoGestor.email}
                            onChange={event => setNovoGestor(prev => ({ ...prev, email: event.target.value }))}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {erroGestor && (
                        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                          <AlertCircle size={16} className="shrink-0" />
                          {erroGestor}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddGestor}
                        disabled={isSavingGestor}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:bg-slate-400 flex items-center justify-center gap-2"
                      >
                        {isSavingGestor ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        {isSavingGestor ? 'Salvando...' : 'Adicionar Gestor'}
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
