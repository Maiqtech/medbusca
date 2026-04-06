import React, { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Clock, User, ChevronRight, Filter, Search, MoreVertical, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ScheduleListProps {
  onBack: () => void;
  onAdd: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const MOCK_SCHEDULES = [
  { id: '1', date: 'Hoje, 31 Mar', shift: 'Manhã', doctor: 'Dr. João Silva', specialty: 'Ortopedia', status: 'Em andamento' },
  { id: '2', date: 'Hoje, 31 Mar', shift: 'Tarde', doctor: 'Dra. Maria Souza', specialty: 'Pediatria', status: 'Pendente' },
  { id: '3', date: 'Hoje, 31 Mar', shift: 'Noite', doctor: 'Dr. Carlos Lima', specialty: 'Clínico Geral', status: 'Pendente' },
  { id: '4', date: 'Amanhã, 01 Abr', shift: 'Manhã', doctor: 'Dra. Ana Paula', specialty: 'Ginecologia', status: 'Confirmado' },
  { id: '5', date: 'Amanhã, 01 Abr', shift: 'Tarde', doctor: 'Dr. Roberto Santos', specialty: 'Cardiologia', status: 'Confirmado' },
];

export default function ScheduleList({ 
  onBack, 
  onAdd, 
  userName,
  onLogout,
  upaName
}: ScheduleListProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DashboardHeader 
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-4 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Escalas de Plantão</h2>
            <p className="text-slate-500 text-sm font-medium">Cronograma de atendimento da unidade</p>
          </div>
          <button 
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nova Escala
          </button>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'today' ? 'Hoje' : tab === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarDays size={14} />
              Plantões de Hoje
            </h3>
            <button className="text-blue-600 text-[10px] font-bold uppercase tracking-wider hover:underline">
              Ver Calendário
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {MOCK_SCHEDULES.map((schedule) => (
              <motion.div 
                key={schedule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${
                      schedule.shift === 'Manhã' ? 'bg-amber-50 text-amber-600' :
                      schedule.shift === 'Tarde' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-900 text-white'
                    }`}>
                      <Clock size={18} />
                      <span className="text-[8px] font-black uppercase mt-0.5">{schedule.shift}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{schedule.doctor}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          schedule.status === 'Em andamento' ? 'bg-green-50 text-green-600' :
                          schedule.status === 'Confirmado' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {schedule.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {schedule.specialty} • {schedule.date}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
