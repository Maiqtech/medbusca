import { useState } from 'react';
import { ArrowLeft, Search, Building2, MapPin, Users, ChevronRight, Plus, Filter, Activity, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface UPAListProps {
  onBack: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  userName: string;
  onLogout: () => void;
}

const MOCK_UPAS = [
  { id: '1', name: 'UPA 24h Hélio Machado', neighborhood: 'Itapuã', doctors: 8, status: 'Ativo' },
  { id: '2', name: 'UPA 24h San Martin', neighborhood: 'San Martin', doctors: 5, status: 'Ativo' },
  { id: '3', name: 'UPA 24h Valéria', neighborhood: 'Valéria', doctors: 6, status: 'Ativo' },
  { id: '4', name: 'UPA 24h Pirajá', neighborhood: 'Pirajá', doctors: 4, status: 'Alerta' },
  { id: '5', name: 'UPA 24h Barris', neighborhood: 'Barris', doctors: 12, status: 'Ativo' },
];

export default function UPAList({ onBack, onAdd, onSelect, userName, onLogout }: UPAListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUpas = MOCK_UPAS.filter(upa => 
    upa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upa.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName="Gestor Municipal"
        subInfo="Unidades de Saúde"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de UPAs</h2>
          <button 
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">Nova UPA</span>
          </button>
        </div>
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome ou bairro..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:border-blue-300 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredUpas.map((upa, index) => (
            <motion.div 
              key={upa.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(upa.id)}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  upa.status === 'Ativo' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{upa.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <MapPin size={10} />
                      {upa.neighborhood}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                      <Users size={10} />
                      {upa.doctors} Médicos
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  upa.status === 'Ativo' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {upa.status}
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
              </div>
            </motion.div>
          ))}

          {filteredUpas.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
              </div>
              <h3 className="text-slate-500 font-bold">Nenhuma UPA encontrada</h3>
              <p className="text-slate-400 text-sm">Tente buscar com outros termos</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
