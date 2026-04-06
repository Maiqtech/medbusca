import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, User, ChevronRight, Stethoscope, Mail, Phone, MoreVertical, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface DoctorListProps {
  onBack: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const MOCK_DOCTORS = [
  { id: '1', name: 'Dr. João Silva', specialty: 'Ortopedia', crm: '12345-BA', email: 'joao@email.com', phone: '(71) 98888-7777', status: 'Ativo' },
  { id: '2', name: 'Dra. Maria Souza', specialty: 'Pediatria', crm: '23456-BA', email: 'maria@email.com', phone: '(71) 98888-6666', status: 'Ativo' },
  { id: '3', name: 'Dr. Carlos Lima', specialty: 'Clínico Geral', crm: '34567-BA', email: 'carlos@email.com', phone: '(71) 98888-5555', status: 'Ativo' },
  { id: '4', name: 'Dra. Ana Paula', specialty: 'Ginecologia', crm: '45678-BA', email: 'ana@email.com', phone: '(71) 98888-4444', status: 'Inativo' },
  { id: '5', name: 'Dr. Roberto Santos', specialty: 'Cardiologia', crm: '56789-BA', email: 'roberto@email.com', phone: '(71) 98888-3333', status: 'Ativo' },
];

export default function DoctorList({ 
  onBack, 
  onAdd, 
  onSelect, 
  userName,
  onLogout,
  upaName
}: DoctorListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = MOCK_DOCTORS.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.crm.includes(searchTerm)
  );

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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Equipe Médica</h2>
            <p className="text-slate-500 text-sm font-medium">Gerencie o corpo clínico da unidade</p>
          </div>
          <button 
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Novo Médico
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome, CRM ou especialidade..."
              className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredDoctors.map((doc) => (
            <motion.div 
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <User size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{doc.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        doc.status === 'Ativo' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Stethoscope size={12} />
                        {doc.specialty}
                      </div>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        CRM: {doc.crm}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Mail size={14} className="text-slate-300" />
                  {doc.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Phone size={14} className="text-slate-300" />
                  {doc.phone}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button 
                  onClick={() => onSelect(doc.id)}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  Ver Perfil Completo
                </button>
                <button className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                  Escalas
                </button>
              </div>
            </motion.div>
          ))}

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-slate-500 font-bold">Nenhum médico encontrado</p>
              <p className="text-slate-400 text-xs mt-1">Tente buscar por outro termo ou cadastre um novo profissional</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
