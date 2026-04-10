import { useState, useEffect, FormEvent } from 'react';
import { UserPlus, Mail, Shield, Save, AlertCircle, Building2, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from './DashboardHeader';
import { usuariosApi, municipiosApi, upasApi } from '../services/api';
import { useApp } from '../store/AppContext';

interface ManagerRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
  title?: string;
  type?: 'municipal' | 'upa';
}

export default function ManagerRegistration({
  onBack, onSuccess, userName, onLogout,
  title = 'Cadastrar Gestor de UPA',
  type = 'upa'
}: ManagerRegistrationProps) {
  const { usuario } = useApp();
  const [formData, setFormData] = useState({ nome: '', email: '', targetId: '' });
  const [opcoes, setOpcoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOpcoes, setIsLoadingOpcoes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const load = type === 'municipal'
      ? municipiosApi.listar()
      : upasApi.listar(usuario?.municipio_id ? { municipio_id: usuario.municipio_id } : {});

    load
      .then(setOpcoes)
      .finally(() => setIsLoadingOpcoes(false));
  }, [type, usuario]);

  // Agrupa municípios por UF para facilitar seleção
  const porEstado = type === 'municipal'
    ? opcoes.reduce((acc: Record<string, any[]>, m) => {
        if (!acc[m.uf]) acc[m.uf] = [];
        acc[m.uf].push(m);
        return acc;
      }, {})
    : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome.trim() || !formData.email.trim() || !formData.targetId) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      await usuariosApi.criar({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        perfil: type === 'municipal' ? 'gestor_municipal' : 'gestor_upa',
        municipio: type === 'municipal' ? Number(formData.targetId) : undefined,
        upa: type === 'upa' ? Number(formData.targetId) : undefined,
      });
      setIsSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar gestor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName={type === 'municipal' ? 'Super Admin' : 'Gestor Municipal'}
        subInfo={title}
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
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-400 font-medium">Preencha os dados de acesso do novo gestor</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados pessoais */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={14} /> Dados de Acesso
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo *</label>
                <input
                  required type="text" placeholder="Ex: João da Silva"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  disabled={isLoading || isSuccess}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required type="email" placeholder="gestor@municipio.gov.br"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-xs font-medium leading-relaxed">
                O gestor receberá um e-mail com um link para criar a própria senha e ativar o acesso.
              </div>
            </div>

            {/* Atribuição */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} /> Atribuição
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {type === 'municipal' ? 'Município Responsável *' : 'Unidade Responsável *'}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  {isLoadingOpcoes ? (
                    <div className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Carregando...
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      value={formData.targetId}
                      onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                      disabled={isLoading || isSuccess}
                    >
                      <option value="">{type === 'municipal' ? 'Selecione um Município...' : 'Selecione uma UPA...'}</option>
                      {type === 'municipal'
                        ? Object.entries(porEstado).sort(([a], [b]) => a.localeCompare(b)).map(([uf, lista]: [string, any[]]) => (
                            <optgroup key={uf} label={`— ${uf} —`}>
                              {lista.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                              ))}
                            </optgroup>
                          ))
                        : opcoes.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.nome} — {u.bairro}</option>
                          ))
                      }
                    </select>
                  )}
                </div>
                {type === 'municipal' && opcoes.length === 0 && !isLoadingOpcoes && (
                  <p className="text-xs text-amber-600 font-medium ml-1">
                    Nenhum município cadastrado. Cadastre um município primeiro.
                  </p>
                )}
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
                  <h4 className="text-xl font-black">Gestor cadastrado!</h4>
                  <p className="text-xs opacity-70">Redirecionando...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button type="submit" disabled={isLoading}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? <><Loader2 size={20} className="animate-spin" /><span>Salvando...</span></> : <><Save size={20} /><span>Cadastrar Gestor</span></>}
                </button>
                <button type="button" onClick={onBack} disabled={isLoading}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <X size={20} /><span>Cancelar</span>
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </main>
    </div>
  );
}
