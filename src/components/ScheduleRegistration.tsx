import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, User, Save, AlertCircle, Plus, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ScheduleRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const SHIFTS = [
  { id: 'morning', name: 'Manhã (07:00 - 13:00)', color: 'bg-amber-50 text-amber-600' },
  { id: 'afternoon', name: 'Tarde (13:00 - 19:00)', color: 'bg-blue-50 text-blue-600' },
  { id: 'night', name: 'Noite (19:00 - 07:00)', color: 'bg-slate-900 text-white' },
];

const MOCK_DOCTORS = [
  { id: '1', name: 'Dr. João Silva', specialty: 'Ortopedia' },
  { id: '2', name: 'Dra. Maria Souza', specialty: 'Pediatria' },
  { id: '3', name: 'Dr. Carlos Lima', specialty: 'Clínico Geral' },
  { id: '4', name: 'Dra. Ana Paula', specialty: 'Ginecologia' },
  { id: '5', name: 'Dr. Roberto Santos', specialty: 'Cardiologia' },
];

export default function ScheduleRegistration({ 
  onBack, 
  onSuccess, 
  userName,
  onLogout,
  upaName
}: ScheduleRegistrationProps) {
  const [formData, setFormData] = useState({
    date: '',
    shift: '',
    doctorId: '',
    notes: '',
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
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nova Escala</h2>
              <p className="text-xs text-slate-400 font-medium">Planeje um novo plantão para a unidade</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Data do Plantão</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="date"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Turno</label>
                <div className="grid grid-cols-1 gap-2">
                  {SHIFTS.map(shift => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => setFormData({...formData, shift: shift.id})}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        formData.shift === shift.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shift.color}`}>
                          <Clock size={20} />
                        </div>
                        <span className={`font-bold text-sm ${formData.shift === shift.id ? 'text-blue-700' : 'text-slate-700'}`}>
                          {shift.name}
                        </span>
                      </div>
                      {formData.shift === shift.id && (
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Médico Responsável</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    required
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    value={formData.doctorId}
                    onChange={e => setFormData({...formData, doctorId: e.target.value})}
                  >
                    <option value="">Selecione um médico...</option>
                    {MOCK_DOCTORS.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Observações (Opcional)</label>
                <textarea 
                  placeholder="Ex: Plantão de sobreaviso, substituição de última hora..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
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
                    Salvar Escala
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-4 rounded-2xl text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                O médico será notificado via aplicativo sobre o novo plantão agendado.
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
