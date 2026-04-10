import { useState, FormEvent } from 'react';
import {
  MapPin, CheckCircle2, AlertCircle, Loader2, Save, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from './DashboardHeader';
import { municipiosApi } from '../services/api';

interface MunicipalityRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
}

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

export default function MunicipalityRegistration({ onBack, onSuccess, userName, onLogout }: MunicipalityRegistrationProps) {
  const [formData, setFormData] = useState({ nome: '', uf: '', ativo: true });
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome.trim() || !formData.uf) {
      setErro('Nome do município e Estado são obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      await municipiosApi.criar({ nome: formData.nome.trim(), uf: formData.uf, ativo: formData.ativo });
      setIsSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar município. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Super Admin"
        subInfo="Novo Município"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800">Cadastrar Município</h2>
          <p className="text-slate-500 text-sm">Adicione um novo município. Após o cadastro, crie o Gestor Municipal e vincule-o a este município.</p>
        </section>

        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Nome do Município *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Salvador"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              {/* UF */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Estado (UF) *
                </label>
                <select
                  value={formData.uf}
                  onChange={e => setFormData({ ...formData, uf: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                  disabled={isLoading || isSuccess}
                >
                  <option value="">Selecione o estado...</option>
                  {STATES.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Status Inicial
                </label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ativo: true })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      formData.ativo ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    disabled={isLoading || isSuccess}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ativo: false })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      !formData.ativo ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    disabled={isLoading || isSuccess}
                  >
                    Inativo
                  </button>
                </div>
              </div>
            </div>

            {/* Info sobre gestor */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-xs font-medium leading-relaxed">
              Após cadastrar o município, vá em <strong>Gestores → Novo Gestor Municipal</strong> para criar e vincular o responsável a este município.
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {erro && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  {erro}
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-xl font-black">Município cadastrado!</h4>
                  <p className="text-xs opacity-70">Redirecionando...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Salvando...</span></>
                  ) : (
                    <><Save size={20} /><span>Salvar Município</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <X size={20} /><span>Cancelar</span>
                </button>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
