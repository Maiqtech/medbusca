import { useState, useEffect, FormEvent } from 'react';
import { Building2, MapPin, Save, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import MapPicker from '../../../components/MapPicker';
import { upasApi, municipiosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface UPARegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
}

export default function UPARegistration({ onBack, onSuccess, userName, onLogout }: UPARegistrationProps) {
  const { usuario } = useApp();
  const [formData, setFormData] = useState({
    nome: '', endereco: '', bairro: '', municipio: '',
    latitude: null as number | null, longitude: null as number | null,
  });
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    municipiosApi.listar()
      .then(muns => {
        setMunicipios(muns);
        if (usuario?.municipio_id) {
          setFormData(prev => ({ ...prev, municipio: String(usuario.municipio_id) }));
        }
      })
      .finally(() => setIsLoadingData(false));
  }, [usuario]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome.trim() || !formData.municipio) {
      setErro('Nome da UPA e Município são obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      await upasApi.criar({
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        bairro: formData.bairro.trim(),
        municipio: Number(formData.municipio),
        latitude: formData.latitude,
        longitude: formData.longitude,
        ativa: true,
      });
      setIsSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar UPA.');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupa municípios por UF
  const porEstado = municipios.reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.uf]) acc[m.uf] = [];
    acc[m.uf].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Gestor Municipal"
        subInfo="Nova Unidade de Saúde"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nova UPA</h2>
              <p className="text-xs text-slate-400 font-medium">Cadastre uma nova unidade de saúde</p>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Carregando dados...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Unidade */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={14} /> Dados da Unidade
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nome da Unidade *</label>
                  <input
                    required type="text" placeholder="Ex: UPA 24h Hélio Machado"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    disabled={isLoading || isSuccess}
                  />
                </div>

                {/* Município */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Município *</label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    value={formData.municipio}
                    onChange={e => setFormData({ ...formData, municipio: e.target.value })}
                    disabled={isLoading || isSuccess || !!usuario?.municipio_id}
                  >
                    <option value="">Selecione o município...</option>
                    {Object.entries(porEstado).sort(([a], [b]) => a.localeCompare(b)).map(([uf, lista]: [string, any[]]) => (
                      <optgroup key={uf} label={`— ${uf} —`}>
                        {lista.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Localização
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Endereço</label>
                  <input
                    type="text" placeholder="Rua, número, complemento..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.endereco}
                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                    disabled={isLoading || isSuccess}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Bairro</label>
                  <input
                    type="text" placeholder="Ex: Itapuã"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.bairro}
                    onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                    disabled={isLoading || isSuccess}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Localização no Mapa</label>
                  <MapPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                    onAddressFound={({ endereco, bairro }) =>
                      setFormData(prev => ({
                        ...prev,
                        endereco: endereco || prev.endereco,
                        bairro: bairro || prev.bairro,
                      }))
                    }
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {erro && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold"
                  >
                    <AlertCircle size={18} className="shrink-0" />{erro}
                  </motion.div>
                )}
                {isSuccess && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-xl font-black">UPA cadastrada!</h4>
                    <p className="text-xs opacity-70">Redirecionando...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isSuccess && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button type="submit" disabled={isLoading}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isLoading ? <><Loader2 size={20} className="animate-spin" /><span>Salvando...</span></> : <><Save size={20} /><span>Salvar UPA</span></>}
                  </button>
                  <button type="button" onClick={onBack} disabled={isLoading}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <X size={20} /><span>Cancelar</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
