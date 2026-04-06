import React from 'react';
import { ArrowLeft, TrendingUp, Users, Clock, Download, Calendar, UserCheck, Timer, History, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ReportsDashboardProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
}

const MOCK_DOCTOR_STATS = [
  { id: '1', name: 'Dr. Ricardo Santos', specialty: 'Clínico Geral', totalHours: '168h', availability: '95%', status: 'Online' },
  { id: '2', name: 'Dra. Juliana Lima', specialty: 'Pediatra', totalHours: '142h', availability: '88%', status: 'Offline' },
  { id: '3', name: 'Dr. Marcos Oliveira', specialty: 'Ortopedista', totalHours: '120h', availability: '92%', status: 'Online' },
  { id: '4', name: 'Dra. Beatriz Costa', specialty: 'Clínico Geral', totalHours: '156h', availability: '98%', status: 'Online' },
];

export default function ReportsDashboard({ onBack, userName, onLogout }: ReportsDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName="Gestor de UPA"
        subInfo="Relatórios de Unidade"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Date Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar size={20} />
            <span className="text-sm font-bold">Março de 2026</span>
          </div>
          <button className="text-blue-600 text-sm font-bold hover:underline">Alterar mês</button>
        </div>

        {/* Big Stats - Focus on Doctors and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">24</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Médicos Ativos no Mês</p>
            <div className="mt-4 flex items-center gap-1 text-green-500 text-xs font-bold">
              <UserCheck size={14} />
              Todos com escalas em dia
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Timer size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">3.840h</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Total Horas em Plantão</p>
            <div className="mt-4 flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <TrendingUp size={14} />
              +4% vs mês anterior
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">92%</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Taxa de Disponibilidade</p>
            <div className="mt-4 flex items-center gap-1 text-slate-500 text-xs font-bold">
              <History size={14} />
              Média de 8h/dia por médico
            </div>
          </div>
        </div>

        {/* Availability Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Horas de Trabalho por Dia (Total Equipe)</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span>Horas Reais</span>
                </div>
              </div>
              <button className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                <Download size={16} />
                <span className="font-bold text-[10px] uppercase">Exportar</span>
              </button>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[60, 75, 80, 65, 90, 85, 40, 55, 70, 85, 95, 75].map((height, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
                className="flex-1 bg-blue-100 rounded-t-lg hover:bg-blue-500 transition-colors cursor-pointer relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {Math.floor(height * 1.2)}h totais
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Semana 1</span>
            <span>Semana 2</span>
            <span>Semana 3</span>
            <span>Semana 4</span>
          </div>
        </div>

        {/* Doctor Performance List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Detalhamento por Profissional</h3>
          <div className="space-y-4">
            {MOCK_DOCTOR_STATS.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{doc.totalHours}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Mês</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">{doc.availability}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assiduidade</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    doc.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {doc.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
