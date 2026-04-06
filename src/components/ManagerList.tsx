import { useState } from 'react';
import { ArrowLeft, Search, User, Mail, Phone, Building2, ChevronRight, UserPlus, Filter, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ManagerListProps {
  onBack: () => void;
  onAdd: () => void;
  userName: string;
  onLogout: () => void;
}

const MOCK_MANAGERS = [
  { id: '1', name: 'João da Silva', email: 'joao@salvador.ba.gov.br', phone: '(71) 98888-0001', upa: 'UPA Hélio Machado', status: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@salvador.ba.gov.br', phone: '(71) 98888-0002', upa: 'UPA San Martin', status: 'Ativo' },
  { id: '3', name: 'Carlos Souza', email: 'carlos@salvador.ba.gov.br', phone: '(71) 98888-0003', upa: 'UPA Valéria', status: 'Ativo' },
  { id: '4', name: 'Ana Santos', email: 'ana@salvador.ba.gov.br', phone: '(71) 98888-0004', upa: 'UPA Pirajá', status: 'Inativo' },
];

export default function ManagerList({ onBack, onAdd, userName, onLogout }: ManagerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredManagers = MOCK_MANAGERS.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.upa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName="Gestor Municipal"
        subInfo="Gestores de Unidade"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestores de UPA</h2>
          <button 
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <UserPlus size={20} />
            <span className="font-bold text-sm">Novo Gestor</span>
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome ou unidade..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:border-blue-300 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {filteredManagers.map((manager, index) => (
            <motion.div 
              key={manager.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{manager.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Building2 size={10} />
                      {manager.upa}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Mail size={10} />
                      {manager.email}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Phone size={10} />
                      {manager.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  manager.status === 'Ativo' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {manager.status}
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
