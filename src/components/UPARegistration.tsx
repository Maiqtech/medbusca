import React, { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Phone, Clock, Save, AlertCircle, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface UPARegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
}

export default function UPARegistration({ onBack, onSuccess, userName, onLogout }: UPARegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    neighborhood: '',
    phone: '',
    capacity: '',
    specialties: [] as string[]
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de salvamento
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  const specialtiesList = ['Clínico Geral', 'Pediatria', 'Ortopedia', 'Ginecologia', 'Odontologia'];

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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={16} />
                Dados da Unidade
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nome da Unidade</label>
                <input 
                  required
                  type="text"
                  placeholder="Ex: UPA 24h Hélio Machado"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Telefone</label>
                  <input 
                    required
                    type="tel"
                    placeholder="(71) 0000-0000"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Capacidade (Leitos)</label>
                  <input 
                    required
                    type="number"
                    placeholder="Ex: 25"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={16} />
                Localização
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Endereço Completo</label>
                <input 
                  required
                  type="text"
                  placeholder="Rua, número, complemento..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Bairro</label>
                <input 
                  required
                  type="text"
                  placeholder="Ex: Itapuã"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} />
                Especialidades Disponíveis
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {specialtiesList.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => {
                      const current = formData.specialties;
                      if (current.includes(spec)) {
                        setFormData({...formData, specialties: current.filter(s => s !== spec)});
                      } else {
                        setFormData({...formData, specialties: [...current, spec]});
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.specialties.includes(spec)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
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
                    Salvar Unidade
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                Após salvar, você poderá vincular gestores e médicos a esta unidade.
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
