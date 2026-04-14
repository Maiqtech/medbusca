import { Search, ShieldCheck, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface LandingPageProps {
  onSelectRole: (role: 'citizen' | 'professional', municipalityData?: any) => void;
  systemName?: string;
  systemLogo?: string;
  municipality?: string;
  municipalities: any[];
}

export default function LandingPage({ onSelectRole, systemName = "MedBusca", systemLogo, municipality = "Bahia", municipalities }: LandingPageProps) {
  const [step, setStep] = useState<'role' | 'municipality'>('role');
  const [selectedState, setSelectedState] = useState('BA');

  const handleCitizenClick = () => {
    setStep('municipality');
  };

  const handleMunicipalitySelect = (muni: any) => {
    onSelectRole('citizen', muni);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200 overflow-hidden">
            {systemLogo ? (
              <img src={systemLogo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Search className="text-white w-6 h-6" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-900">
            {systemName}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div 
              key="role-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
                  Como deseja acessar?
                </h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto">
                  Escolha o perfil que melhor descreve sua necessidade no momento para continuar.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Card 1: Citizen */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCitizenClick}
                  className="group bg-white p-8 rounded-3xl border-2 border-transparent hover:border-blue-600 shadow-xl shadow-slate-200 transition-all text-left flex flex-col gap-6 relative overflow-hidden select-none active:bg-slate-50"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Search size={120} className="text-blue-600" />
                  </div>
                  
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                    <Search size={32} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Sou Cidadão</h3>
                    <p className="text-slate-500 leading-relaxed">
                      Consulte em tempo real quais UPAs possuem especialistas disponíveis e evite filas desnecessárias.
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 group-hover:bg-blue-700 transition-all w-full">
                    Acessar portal público
                  </div>
                </motion.button>

                {/* Card 2: Professional */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectRole('professional')}
                  className="group bg-white p-8 rounded-3xl border-2 border-transparent hover:border-emerald-600 shadow-xl shadow-slate-200 transition-all text-left flex flex-col gap-6 relative overflow-hidden select-none active:bg-slate-50"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={120} className="text-emerald-600" />
                  </div>

                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                    <ShieldCheck size={32} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Sou Profissional</h3>
                    <p className="text-slate-500 leading-relaxed">
                      Área restrita para médicos e gestores realizarem o registro de presença e controle de escalas.
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 group-hover:bg-emerald-700 transition-all w-full">
                    Entrar no sistema
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="municipality-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-2xl"
            >
              <button 
                onClick={() => setStep('role')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors mb-8 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Voltar para seleção de perfil
              </button>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
                  Onde você está?
                </h2>
                <p className="text-slate-500">
                  Selecione sua cidade para acessar o portal personalizado da sua região.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Estado</label>
                  <select 
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white font-bold text-slate-700 appearance-none"
                  >
                    <option value="BA">Bahia (BA)</option>
                    <option value="SP">São Paulo (SP)</option>
                    <option value="RJ">Rio de Janeiro (RJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cidades Disponíveis</label>
                  <div className="grid gap-3">
                    {municipalities.filter(m => m.uf === selectedState).map((muni) => (
                      <button
                        key={muni.id}
                        onClick={() => handleMunicipalitySelect(muni)}
                        className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 transition-all group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                            {muni.logo ? (
                              <img src={muni.logo} alt={muni.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <MapPin size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-lg">{muni.name}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{muni.uf}</p>
                          </div>
                        </div>
                        <ChevronRight size={24} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                    
                    {municipalities.filter(m => m.uf === selectedState).length === 0 && (
                      <div className="p-8 text-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500 font-bold italic">Nenhuma cidade cadastrada neste estado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-12 text-center text-slate-400 text-sm font-medium">
                Sua cidade não está na lista? <br />
                <span className="text-blue-600 font-bold cursor-pointer hover:underline">Solicite a inclusão do seu município.</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
          Sistema público de apoio à saúde • {municipality}
        </p>
      </footer>
    </div>
  );
}
