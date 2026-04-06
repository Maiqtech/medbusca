import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, ArrowLeft, Calendar, Info, ChevronRight, Stethoscope, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CitizenPortalProps {
  onBack: () => void;
  onMunicipalityChange?: (municipalityData: any) => void;
  systemName?: string;
  systemLogo?: string;
  municipality?: string;
}

type Specialty = 'Clínica Geral' | 'Ortopedia' | 'Pediatria' | 'Ginecologia' | 'Cardiologia';

interface UPAResult {
  id: string;
  name: string;
  neighborhood: string;
  specialty: Specialty;
  status: 'available' | 'unavailable' | 'scheduled';
  nextShift?: string;
}

const SPECIALTIES: Specialty[] = ['Clínica Geral', 'Ortopedia', 'Pediatria', 'Ginecologia', 'Cardiologia'];

const STATES = [
  { code: 'BA', name: 'Bahia' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'AL', name: 'Alagoas' }
];

const CITIES: Record<string, string[]> = {
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna'],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto'],
  'AL': ['Maceió', 'Arapiraca', 'Rio Largo']
};

const MOCK_RESULTS: Record<Specialty, UPAResult[]> = {
  'Clínica Geral': [
    { id: '1', name: 'UPA 24h Hélio Machado', neighborhood: 'Itapuã', specialty: 'Clínica Geral', status: 'available' },
    { id: '2', name: 'UPA 24h San Martin', neighborhood: 'San Martin', specialty: 'Clínica Geral', status: 'available' },
    { id: '3', name: 'UPA 24h Valéria', neighborhood: 'Valéria', specialty: 'Clínica Geral', status: 'unavailable', nextShift: 'hoje às 19:00' },
  ],
  'Ortopedia': [
    { id: '1', name: 'UPA 24h Hélio Machado', neighborhood: 'Itapuã', specialty: 'Ortopedia', status: 'available' },
    { id: '4', name: 'UPA 24h Centro', neighborhood: 'Centro', specialty: 'Ortopedia', status: 'unavailable', nextShift: 'amanhã às 08:00' },
  ],
  'Pediatria': [
    { id: '5', name: 'UPA 24h Cajazeiras', neighborhood: 'Cajazeiras', specialty: 'Pediatria', status: 'available' },
    { id: '2', name: 'UPA 24h San Martin', neighborhood: 'San Martin', specialty: 'Pediatria', status: 'unavailable', nextShift: 'hoje às 13:00' },
  ],
  'Ginecologia': [
    { id: '3', name: 'UPA 24h Valéria', neighborhood: 'Valéria', specialty: 'Ginecologia', status: 'available' },
  ],
  'Cardiologia': [] // Empty case
};

export default function CitizenPortal({ onBack, onMunicipalityChange, systemName = "MedBusca", systemLogo, municipality = "Salvador" }: CitizenPortalProps) {
  const [selectedState, setSelectedState] = useState(municipality.split('-')[1] || 'BA');
  const [selectedCity, setSelectedCity] = useState(municipality.split('-')[0] || 'Salvador');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');
  const [results, setResults] = useState<UPAResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // Se já temos a cidade vinda da landing page, podemos carregar resultados iniciais ou apenas setar o estado
    if (municipality) {
      const [city, uf] = municipality.split('-');
      setSelectedCity(city);
      setSelectedState(uf || 'BA');
    }
  }, [municipality]);

  // Notifica o App.tsx quando a cidade muda para atualizar a marca
  useEffect(() => {
    if (onMunicipalityChange && selectedCity) {
      onMunicipalityChange({ name: selectedCity, uf: selectedState });
    }
  }, [selectedCity, selectedState]);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simula a detecção de Salvador, BA baseado nas coordenadas
          setTimeout(() => {
            setSelectedState('BA');
            setSelectedCity(municipality);
            setIsLocating(false);
          }, 1500);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setIsLocating(false);
        }
      );
    }
  };

  const handleSearch = () => {
    if (!selectedSpecialty || !selectedCity) return;
    
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      setResults(MOCK_RESULTS[selectedSpecialty as Specialty]);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden p-1">
            {systemLogo ? (
              <img src={systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Search className="text-white w-6 h-6" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-900">
            {systemName}
          </h1>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Hero Section */}
        <section className="mt-4 text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
            Encontre atendimento disponível
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Selecione sua localização e a especialidade desejada
          </p>
        </section>

        {/* Search Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Location Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Estado
              </label>
              <div className="relative">
                <select 
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                >
                  {STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                Cidade
                {isLocating && <span className="text-[8px] text-blue-500 animate-pulse lowercase">Detectando...</span>}
              </label>
              <div className="relative">
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                >
                  <option value="">Selecione a cidade</option>
                  {CITIES[selectedState]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <Navigation className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLocating ? 'text-blue-500 animate-bounce' : 'text-slate-300'}`} size={16} />
              </div>
            </div>
          </div>

          {/* Specialty Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Especialidade Médica
            </label>
            <div className="relative">
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value as Specialty)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              >
                <option value="">Qual atendimento você busca?</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="text-slate-300 rotate-90" size={20} />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSearch}
            disabled={!selectedSpecialty || !selectedCity || isSearching}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            {isSearching ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search size={24} strokeWidth={3} />
                BUSCAR ATENDIMENTO
              </>
            )}
          </button>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div 
              key={`${selectedSpecialty}-${selectedCity}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Resultados em {selectedCity}
                </h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                  {results.length} Unidades
                </span>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {results.map((upa) => (
                    <motion.div 
                      key={upa.id}
                      className={`bg-white p-5 rounded-[2rem] border transition-all ${
                        upa.status === 'available' 
                        ? 'border-green-100 shadow-lg shadow-green-50' 
                        : 'border-slate-100 opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-800 text-lg leading-tight">{upa.name}</h4>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <MapPin size={12} className="text-slate-300" />
                            {upa.neighborhood}
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                          upa.status === 'available' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-slate-50 text-slate-400'
                        }`}>
                          {upa.status === 'available' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {upa.status === 'available' ? 'Disponível agora' : 'Indisponível'}
                          </span>
                        </div>
                      </div>

                      {upa.status === 'unavailable' && upa.nextShift && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                          <Calendar size={16} className="text-slate-400" />
                          <p className="text-xs text-slate-600 font-medium">
                            Próxima previsão: <span className="font-bold text-slate-800">{upa.nextShift}</span>
                          </p>
                        </div>
                      )}

                      {upa.status === 'available' && (
                        <div className="mt-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                            Atendimento Ativo
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800 text-xl">Nenhum atendimento agora</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Não encontramos especialistas em <strong>{selectedSpecialty}</strong> ativos no momento em {selectedCity}.
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50 text-left space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximas Previsões</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">UPA Centro</span>
                        <span className="text-xs font-black text-blue-600">Amanhã 08:00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">UPA Cajazeiras</span>
                        <span className="text-xs font-black text-blue-600">Amanhã 14:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative Note */}
        <div className="bg-blue-50 p-5 rounded-[2rem] flex items-start gap-4 border border-blue-100">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            As informações são atualizadas em tempo real conforme o registro de presença dos profissionais. 
            A disponibilidade exibida depende do status de turno informado pelas unidades.
          </p>
        </div>
      </main>

      {/* PWA Style Footer */}
      <footer className="mt-10 pb-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2 opacity-30">
          <div className="w-6 h-6 bg-slate-400 rounded flex items-center justify-center">
            <Search className="text-white w-3 h-3" />
          </div>
          <p className="text-xs font-black tracking-tighter text-slate-800">
            Med<span className="text-slate-500">Busca</span>
          </p>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Secretaria Municipal de Saúde • {municipality}
        </p>
      </footer>
    </div>
  );
}
