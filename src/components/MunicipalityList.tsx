import { useState } from 'react';
import { ArrowLeft, Search, MapPin, Building2, Users, ChevronRight, Plus, Filter, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface MunicipalityListProps {
  onBack: () => void;
  onAdd: () => void;
  userName: string;
  onLogout: () => void;
}

const MOCK_MUNICIPALITIES = [
  { id: '1', name: 'Salvador', state: 'BA', population: '2.8M', upas: 12, managers: 3, status: 'Ativo' },
  { id: '2', name: 'Feira de Santana', state: 'BA', population: '619k', upas: 4, managers: 1, status: 'Ativo' },
  { id: '3', name: 'Vitória da Conquista', state: 'BA', population: '341k', upas: 3, managers: 2, status: 'Ativo' },
  { id: '4', name: 'Camaçari', state: 'BA', population: '299k', upas: 2, managers: 0, status: 'Pendente' },
  { id: '5', name: 'Lauro de Freitas', state: 'BA', population: '201k', upas: 2, managers: 1, status: 'Ativo' },
];

export default function MunicipalityList({ onBack, onAdd, userName, onLogout }: MunicipalityListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_MUNICIPALITIES.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName="Super Admin"
        subInfo="Municípios Parceiros"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Municípios</h2>
          <button 
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">Novo Município</span>
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome da cidade..."
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
          {filtered.map((city, index) => (
            <motion.div 
              key={city.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  city.status === 'Ativo' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{city.name} - {city.state}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Users size={10} />
                      Pop: {city.population}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Building2 size={10} />
                      {city.upas} UPAs
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Users size={10} />
                      {city.managers} Gestores
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  city.status === 'Ativo' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {city.status}
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
