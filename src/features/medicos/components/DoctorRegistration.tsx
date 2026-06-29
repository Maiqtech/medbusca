import { useState, useEffect, FormEvent } from 'react';
import { UserPlus, Mail, Save, AlertCircle, Stethoscope, Hash, CheckCircle2, Loader2, X, Info } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { especialidadesApi, upasApi, medicosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface DoctorRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

export default function DoctorRegistration({ onBack, onSuccess, userName, onLogout, upaName }: DoctorRegistrationProps) {
  const { usuario } = useApp();
  const [formData, setFormData] = useState({
    nome: '', crm: '', uf: '', especialidade: '', upa: '', email: ''
  });
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [upas, setUpas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  useEffect(() => {
    Promise.all([
      especialidadesApi.listar(),
      upasApi.listar(usuario?.municipio_id ? { municipio_id: usuario.municipio_id } : {}),
    ]).then(([specs, us]) => {
      setEspecialidades(specs);
      setUpas(us);
      // Pré-seleciona UPA do gestor
      if (usuario?.upa_id) {
        setFormData(prev => ({ ...prev, upa: String(usuario.upa_id) }));
      }
    }).finally(() => setIsLoadingData(false));
  }, [usuario]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome.trim() || !formData.crm.trim() || !formData.uf || !formData.especialidade || !formData.upa) {
      setErro('Nome, CRM, UF, Especialidade e UPA são obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      await medicosApi.criar({
        nome: formData.nome.trim(),
        crm: formData.crm.trim(),
        uf: formData.uf,
        especialidade: Number(formData.especialidade),
        upa: Number(formData.upa),
        email: formData.email.trim() || undefined,
      });
      setIsSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar médico.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
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
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Novo Médico</h2>
              <p className="text-xs text-slate-400 font-medium">Cadastre um novo profissional na unidade</p>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo *</label>
                  <input
                    required type="text" placeholder="Ex: Dr. João da Silva"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    disabled={isLoading || isSuccess}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_1fr] gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">CRM *</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required type="text" placeholder="00000"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.crm}
                        onChange={e => setFormData({ ...formData, crm: e.target.value })}
                        disabled={isLoading || isSuccess}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">UF *</label>
                    <select
                      required
                      className="w-full px-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-bold text-slate-700 text-center"
                      value={formData.uf}
                      onChange={e => setFormData({ ...formData, uf: e.target.value })}
                      disabled={isLoading || isSuccess}
                    >
                      <option value="">--</option>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Especialidade *</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select
                        required
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        value={formData.especialidade}
                        onChange={e => setFormData({ ...formData, especialidade: e.target.value })}
                        disabled={isLoading || isSuccess}
                      >
                        <option value="">Selecione...</option>
                        {especialidades.map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* UPA */}
                {!usuario?.upa_id && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">UPA *</label>
                    <select
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      value={formData.upa}
                      onChange={e => setFormData({ ...formData, upa: e.target.value })}
                      disabled={isLoading || isSuccess}
                    >
                      <option value="">Selecione a UPA...</option>
                      {upas.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} — {u.bairro}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Acesso ao sistema (opcional) */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Acesso ao Sistema (opcional)
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">E-mail de login</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email" placeholder="medico@email.com"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        disabled={isLoading || isSuccess}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Se informar o e-mail, o médico receberá um link para criar a própria senha e acessar o sistema para registrar turnos.
                    </p>
                  </div>
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
                    <h4 className="text-xl font-black">Médico cadastrado!</h4>
                    <p className="text-xs opacity-70">Redirecionando...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isSuccess && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button type="submit" disabled={isLoading}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isLoading ? <><Loader2 size={20} className="animate-spin" /><span>Salvando...</span></> : <><Save size={20} /><span>Cadastrar Médico</span></>}
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
