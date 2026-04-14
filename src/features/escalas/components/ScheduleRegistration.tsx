import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, Clock, User, Save, AlertCircle, Plus, ChevronRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { escalasApi, medicosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ScheduleRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const SHIFTS = [
  { id: 'morning', name: 'Manha (07:00 - 13:00)', color: 'bg-amber-50 text-amber-600', horaInicio: '07:00:00', horaFim: '13:00:00' },
  { id: 'afternoon', name: 'Tarde (13:00 - 19:00)', color: 'bg-blue-50 text-blue-600', horaInicio: '13:00:00', horaFim: '19:00:00' },
  { id: 'night', name: 'Noite (19:00 - 07:00)', color: 'bg-slate-900 text-white', horaInicio: '19:00:00', horaFim: '07:00:00' },
];

export default function ScheduleRegistration({
  onBack,
  onSuccess,
  userName,
  onLogout,
  upaName,
}: ScheduleRegistrationProps) {
  const { usuario } = useApp();
  const [formData, setFormData] = useState({
    date: '',
    shift: '',
    doctorId: '',
  });
  const [medicos, setMedicos] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsLoadingData(true);
    setErro(null);

    medicosApi
      .listar(usuario?.upa_id ? { upa_id: usuario.upa_id } : {})
      .then(setMedicos)
      .catch(error => setErro(error?.message || 'Erro ao carregar medicos da unidade.'))
      .finally(() => setIsLoadingData(false));
  }, [usuario?.upa_id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);

    const turnoSelecionado = SHIFTS.find(shift => shift.id === formData.shift);

    if (!formData.date || !turnoSelecionado || !formData.doctorId) {
      setErro('Data, turno e medico sao obrigatorios.');
      return;
    }

    setIsLoading(true);
    try {
      await escalasApi.criar({
        medico: Number(formData.doctorId),
        data: formData.date,
        hora_inicio: turnoSelecionado.horaInicio,
        hora_fim: turnoSelecionado.horaFim,
      });
      setIsSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (error: any) {
      setErro(error?.message || 'Erro ao salvar a escala.');
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
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nova Escala</h2>
              <p className="text-xs text-slate-400 font-medium">Planeje um novo plantao para a unidade</p>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Carregando medicos...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Data do Plantao</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="date"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={formData.date}
                      onChange={event => setFormData(prev => ({ ...prev, date: event.target.value }))}
                      disabled={isLoading || isSuccess}
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
                        onClick={() => setFormData(prev => ({ ...prev, shift: shift.id }))}
                        disabled={isLoading || isSuccess}
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
                  <label className="text-sm font-bold text-slate-700 ml-1">Medico Responsavel</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      required
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      value={formData.doctorId}
                      onChange={event => setFormData(prev => ({ ...prev, doctorId: event.target.value }))}
                      disabled={isLoading || isSuccess || medicos.length === 0}
                    >
                      <option value="">Selecione um medico...</option>
                      {medicos.map(medico => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nome} ({medico.especialidade_nome})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {medicos.length === 0 && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-4 rounded-2xl text-xs font-medium">
                    <AlertCircle size={16} className="shrink-0" />
                    Cadastre um medico na UPA antes de montar uma escala.
                  </div>
                )}
              </div>

              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold"
                  >
                    <AlertCircle size={18} className="shrink-0" />
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
                    <h4 className="text-xl font-black">Escala cadastrada!</h4>
                    <p className="text-xs opacity-70">Redirecionando...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isSuccess && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || medicos.length === 0}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Salvar Escala</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <X size={20} />
                    <span>Cancelar</span>
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
