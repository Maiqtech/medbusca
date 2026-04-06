import React from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ChevronRight, 
  LogOut, 
  User,
  Activity,
  Coffee,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface UPAManagerDashboardProps {
  userName: string;
  upaName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  systemName?: string;
  systemLogo?: string;
}

const MOCK_DOCTORS = [
  { id: '1', name: 'Dr. João Silva', specialty: 'Ortopedia', status: 'Em atendimento', lastUpdate: 'Agora', statusColor: 'text-green-600 bg-green-50' },
  { id: '2', name: 'Dra. Maria Souza', specialty: 'Pediatria', status: 'Em pausa', lastUpdate: '10 min', statusColor: 'text-amber-600 bg-amber-50' },
  { id: '3', name: 'Dr. Carlos Lima', specialty: 'Clínico Geral', status: 'Em atendimento', lastUpdate: '5 min', statusColor: 'text-green-600 bg-green-50' },
  { id: '4', name: 'Dra. Ana Paula', specialty: 'Ginecologia', status: 'Offline', lastUpdate: '1h', statusColor: 'text-slate-400 bg-slate-50' },
];

const ALERTS = [
  { id: '1', message: 'Especialidade sem médico ativo no momento (Cardiologia)', type: 'critical' },
  { id: '2', message: 'Médico com turno ainda não iniciado (Dr. Roberto)', type: 'warning' },
  { id: '3', message: 'Escala do dia com cobertura incompleta (Noturno)', type: 'warning' },
  { id: '4', message: 'Unidade com alta demanda (Tempo de espera > 40min)', type: 'info' },
];

export default function UPAManagerDashboard({ userName, upaName, onLogout, onNavigate, systemName, systemLogo }: UPAManagerDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <DashboardHeader 
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
        onLogout={onLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="p-4 max-w-5xl mx-auto space-y-6">
        {/* Title Section */}
        <section className="mt-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel da UPA</h2>
          <p className="text-slate-500 text-sm font-medium">Gerencie médicos, escalas e funcionamento da unidade</p>
        </section>

        {/* Indicators Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">15</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Médicos</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-3">
              <Stethoscope size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">08</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Em atendimento</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
              <Coffee size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">02</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Em pausa</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">10</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Encerrados</p>
          </motion.div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button 
              onClick={() => onNavigate('register_doctor')}
              className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Cadastrar Médico</p>
                <p className="text-[10px] opacity-70">Adicionar novo profissional</p>
              </div>
            </button>

            <button 
              onClick={() => onNavigate('list_doctors')}
              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Ver Médicos</p>
                <p className="text-[10px] text-slate-400">Listagem da equipe</p>
              </div>
            </button>

            <button 
              onClick={() => onNavigate('register_schedule')}
              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Cadastrar Escala</p>
                <p className="text-[10px] text-slate-400">Planejar plantões</p>
              </div>
            </button>

            <button 
              onClick={() => onNavigate('list_schedules')}
              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Ver Escalas</p>
                <p className="text-[10px] text-slate-400">Consultar cronograma</p>
              </div>
            </button>

            <button 
              onClick={() => onNavigate('monitor_shifts')}
              className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-3xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 sm:col-span-2 md:col-span-1"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Activity size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Acompanhar Turnos</p>
                <p className="text-[10px] opacity-70">Operação em tempo real</p>
              </div>
            </button>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">Alertas e Observações</h3>
          </div>
          <div className="space-y-3">
            {ALERTS.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-2xl flex items-start gap-3 border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-100 text-red-700' :
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  'bg-blue-50 border-blue-100 text-blue-700'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  alert.type === 'critical' ? 'bg-red-500' :
                  alert.type === 'warning' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}></div>
                <p className="text-xs font-bold leading-tight">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Doctors List Summary */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Médicos na Unidade</h3>
            <button 
              onClick={() => onNavigate('list_doctors')}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {MOCK_DOCTORS.map((doc) => (
              <button 
                key={doc.id}
                onClick={() => onNavigate(`doctor_detail_${doc.id}`)}
                className="w-full flex items-center justify-between py-4 hover:bg-slate-50 rounded-2xl transition-colors px-2 -mx-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-800">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden xs:block">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${doc.statusColor}`}>
                      {doc.status}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">Atualizado há {doc.lastUpdate}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation (PWA Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 flex justify-around items-center z-30 sm:hidden">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Activity size={20} />
          <span className="text-[9px] font-bold uppercase">Painel</span>
        </button>
        <button onClick={() => onNavigate('list_doctors')} className="flex flex-col items-center gap-1 text-slate-400">
          <Users size={20} />
          <span className="text-[9px] font-bold uppercase">Equipe</span>
        </button>
        <button onClick={() => onNavigate('list_schedules')} className="flex flex-col items-center gap-1 text-slate-400">
          <Calendar size={20} />
          <span className="text-[9px] font-bold uppercase">Escalas</span>
        </button>
        <button onClick={() => onNavigate('monitor_shifts')} className="flex flex-col items-center gap-1 text-slate-400">
          <Clock size={20} />
          <span className="text-[9px] font-bold uppercase">Turnos</span>
        </button>
      </nav>
    </div>
  );
}
