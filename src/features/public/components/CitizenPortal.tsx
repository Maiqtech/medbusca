import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, ArrowLeft, Calendar, Info, ChevronRight, Stethoscope, AlertCircle, CheckCircle2, Navigation, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { municipiosApi, especialidadesApi, upasApi } from '../../../services/api';
import { X } from 'lucide-react';

interface CitizenPortalProps {
  onBack: () => void;
  onMunicipalityChange?: (municipalityData: any) => void;
  systemName?: string;
  systemLogo?: string;
  municipality?: string;
}

export default function CitizenPortal({ onBack, onMunicipalityChange, systemName = "MedBusca", systemLogo }: CitizenPortalProps) {
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<any>(null);
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<any>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [upaDetalhe, setUpaDetalhe] = useState<any>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [previsaoUpas, setPrevisaoUpas] = useState<any[] | null>(null);

  const abrirDetalhe = async (upa: any) => {
    setLoadingDetalhe(true);
    setUpaDetalhe({ ...upa, especialidades_status: null });
    try {
      const data = await upasApi.disponibilidade(upa.id);
      setUpaDetalhe(data);
    } catch {
      setUpaDetalhe(null);
    } finally {
      setLoadingDetalhe(false);
    }
  };

  useEffect(() => {
    Promise.all([municipiosApi.listar(), especialidadesApi.listar()])
      .then(([muns, specs]) => {
        setMunicipios(muns);
        setEspecialidades(specs);
      })
      .catch(() => setErro('Erro ao carregar dados. Verifique sua conexão.'))
      .finally(() => setIsLoadingData(false));
  }, []);

  useEffect(() => {
    if (onMunicipalityChange && selectedMunicipio) {
      onMunicipalityChange({ name: selectedMunicipio.nome, uf: selectedMunicipio.uf });
    }
  }, [selectedMunicipio]);

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          // Seleciona o primeiro município disponível como simulação de geolocalização
          if (municipios.length > 0) setSelectedMunicipio(municipios[0]);
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    }
  };

  const refetchUPAs = useCallback(async () => {
    if (!selectedMunicipio) return;
    try {
      const params: any = { municipio_id: selectedMunicipio.id };
      if (selectedEspecialidade) params.especialidade_id = selectedEspecialidade.id;
      const upas = await upasApi.listar(params);
      setResults(upas);
      setUltimaAtualizacao(new Date());
    } catch {
      // silencioso — não resetar dados existentes em falha de polling
    }
  }, [selectedMunicipio?.id, selectedEspecialidade?.id]);

  useEffect(() => {
    if (!results) return;
    const intervalo = setInterval(refetchUPAs, 10_000);
    return () => clearInterval(intervalo);
  }, [!!results, refetchUPAs]);

  const handleSearch = async () => {
    if (!selectedMunicipio) return;
    setIsSearching(true);
    setErro(null);
    setPrevisaoUpas(null);
    try {
      const params: any = { municipio_id: selectedMunicipio.id };
      if (selectedEspecialidade) params.especialidade_id = selectedEspecialidade.id;
      const upas = await upasApi.listar(params);
      setResults(upas);
      setUltimaAtualizacao(new Date());
      if (upas.length === 0 && selectedEspecialidade) {
        const todas = await upasApi.listar({ municipio_id: selectedMunicipio.id });
        setPrevisaoUpas(todas.slice(0, 2));
      }
    } catch {
      setErro('Erro ao buscar UPAs. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
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
          <h1 className="text-xl font-bold tracking-tight text-blue-900">{systemName}</h1>
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
        <section className="mt-4 text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
            Encontre atendimento disponível
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Selecione sua cidade — filtre por especialidade se desejar
          </p>
        </section>

        {/* Search Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* Município */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  Município
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-[9px] text-blue-500 font-bold uppercase hover:underline flex items-center gap-1"
                    disabled={isLocating}
                  >
                    <Navigation size={10} className={isLocating ? 'animate-bounce' : ''} />
                    {isLocating ? 'Detectando...' : 'Usar localização'}
                  </button>
                </label>
                <div className="relative">
                  <select
                    value={selectedMunicipio?.id || ''}
                    onChange={(e) => {
                      const m = municipios.find(m => String(m.id) === e.target.value);
                      setSelectedMunicipio(m || null);
                      setResults(null);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                  >
                    <option value="">Selecione o município</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} / {m.uf}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                </div>
              </div>

              {/* Especialidade */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Especialidade Médica
                </label>
                <div className="relative">
                  <select
                    value={selectedEspecialidade?.id || ''}
                    onChange={(e) => {
                      const s = especialidades.find(s => String(s.id) === e.target.value);
                      setSelectedEspecialidade(s || null);
                      setResults(null);
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                  >
                    <option value="">Todas as especialidades</option>
                    {especialidades.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
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
                disabled={!selectedMunicipio || isSearching}
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
            </>
          )}
        </section>

        {/* Error */}
        {erro && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            {erro}
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              key={`${selectedEspecialidade?.id}-${selectedMunicipio?.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Resultados em {selectedMunicipio?.nome}
                </h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                  {results.length} Unidades
                </span>
              </div>
              {ultimaAtualizacao && (
                <p className="text-[10px] text-slate-400 font-bold px-2">
                  Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {results.map((upa) => {
                    const semFiltro = upa.status_especialidade === null;
                    const disponivel = upa.status_especialidade?.disponivel;
                    const proximoTurno = upa.status_especialidade?.proximo_turno;
                    return (
                      <motion.div
                        key={upa.id}
                        onClick={() => abrirDetalhe(upa)}
                        className={`bg-white p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-md ${
                          semFiltro ? 'border-slate-100' : disponivel ? 'border-green-100 shadow-lg shadow-green-50' : 'border-slate-100 opacity-80'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-800 text-lg leading-tight">{upa.nome}</h4>
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <MapPin size={12} className="text-slate-300" />
                              {upa.bairro || upa.municipio_nome}
                            </div>
                            {semFiltro && upa.especialidades?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {upa.especialidades.map((e: any) => (
                                  <span key={e.id} className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                    {e.nome}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {(upa.latitude && upa.longitude) && (
                              <a
                                href={`https://www.google.com/maps?q=${upa.latitude},${upa.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                aria-label={`Ver ${upa.nome} no Google Maps`}
                              >
                                <Navigation size={14} />
                                <span className="text-[10px] font-bold hidden sm:inline">Mapa</span>
                              </a>
                            )}
                            {!semFiltro && (
                              <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                                disponivel ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                                {disponivel ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                  {disponivel ? 'Disponível agora' : 'Indisponível'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!semFiltro && !disponivel && proximoTurno && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                            <Calendar size={16} className="text-slate-400" />
                            <p className="text-xs text-slate-600 font-medium">
                              Próxima previsão: <span className="font-bold text-slate-800">{proximoTurno}</span>
                            </p>
                          </div>
                        )}

                        {!semFiltro && disponivel && (
                          <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                              Atendimento Ativo
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle size={32} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-800 text-lg">Especialidade indisponível</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Nenhuma unidade em <strong>{selectedMunicipio?.nome}</strong> possui <strong>{selectedEspecialidade?.nome}</strong> cadastrada no momento.
                      </p>
                    </div>
                  </div>
                  {previsaoUpas && previsaoUpas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        Unidades disponíveis na região
                      </p>
                      {previsaoUpas.map((upa) => (
                        <motion.div
                          key={upa.id}
                          onClick={() => abrirDetalhe(upa)}
                          className="bg-white p-5 rounded-[2rem] border border-slate-100 cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-800 text-base leading-tight">{upa.nome}</h4>
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <MapPin size={12} className="text-slate-300" />
                                {upa.bairro || upa.municipio_nome}
                              </div>
                              {upa.especialidades?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {upa.especialidades.map((e: any) => (
                                    <span key={e.id} className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                      {e.nome}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase bg-slate-50 px-2 py-1.5 rounded-xl">
                              <Info size={12} />
                              Ver detalhes
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="bg-blue-50 p-5 rounded-[2rem] flex items-start gap-4 border border-blue-100">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            As informações são atualizadas em tempo real conforme o registro de presença dos profissionais.
            A disponibilidade depende do status de turno informado pelas unidades.
          </p>
        </div>
      </main>

      {/* Modal de detalhe da UPA */}
      {(upaDetalhe || loadingDetalhe) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setUpaDetalhe(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[80vh] overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-xl">{upaDetalhe?.nome}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{upaDetalhe?.bairro}</p>
              </div>
              <button onClick={() => setUpaDetalhe(null)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {loadingDetalhe ? (
              <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Carregando especialidades...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidades disponíveis</p>
                {upaDetalhe?.especialidades?.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma especialidade cadastrada.</p>
                )}
                {upaDetalhe?.especialidades?.map((esp: any) => (
                  <div key={esp.especialidade_id} className={`flex items-center justify-between p-4 rounded-2xl border ${esp.disponivel ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <Stethoscope size={16} className={esp.disponivel ? 'text-green-500' : 'text-slate-300'} />
                      <span className="font-bold text-slate-700 text-sm">{esp.especialidade}</span>
                    </div>
                    <div className="text-right">
                      {esp.disponivel ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase">
                          <CheckCircle2 size={12} /> Disponível
                        </span>
                      ) : esp.proximo_turno ? (
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Próximo</p>
                          <p className="text-xs font-bold text-slate-600">{esp.proximo_turno}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase">Sem agenda</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
          Plataforma Pública de Saúde
        </p>
      </footer>
    </div>
  );
}
