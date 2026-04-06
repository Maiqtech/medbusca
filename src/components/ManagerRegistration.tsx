import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Mail, Phone, Shield, Save, AlertCircle, Building2, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ManagerRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
  title?: string;
  type?: 'municipal' | 'upa';
}

export default function ManagerRegistration({ 
  onBack, 
  onSuccess, 
  userName,
  onLogout,
  title = "Cadastrar Gestor de UPA",
  type = 'upa'
}: ManagerRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    targetId: '',
    role: type === 'municipal' ? 'Gestor Municipal' : 'Gestor de Unidade'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName={type === 'municipal' ? "Super Admin" : "Gestor Municipal"}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={16} />
                Dados Pessoais
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo</label>
                <input 
                  required
                  type="text"
                  placeholder="Ex: João da Silva"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="email"
                      placeholder={type === 'municipal' ? "gestor@municipio.ba.gov.br" : "gestor@upa.ba.gov.br"}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel"
                      placeholder="(71) 90000-0000"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={16} />
                Atribuição
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {type === 'municipal' ? 'Município Responsável' : 'Unidade Responsável'}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    required
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    value={formData.targetId}
                    onChange={e => setFormData({...formData, targetId: e.target.value})}
                  >
                    <option value="">{type === 'municipal' ? 'Selecione um Município...' : 'Selecione uma UPA...'}</option>
                    {type === 'municipal' ? (
                      <>
                        <option value="1">Salvador</option>
                        <option value="2">Feira de Santana</option>
                        <option value="3">Vitória da Conquista</option>
                      </>
                    ) : (
                      <>
                        <option value="1">UPA 24h Hélio Machado</option>
                        <option value="2">UPA 24h San Martin</option>
                        <option value="3">UPA 24h Valéria</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    Cadastrar Gestor
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-4 rounded-2xl text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                Um e-mail com as credenciais de acesso será enviado automaticamente para o novo gestor.
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
