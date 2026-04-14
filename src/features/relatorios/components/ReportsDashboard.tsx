import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  History,
  Loader2,
  Timer,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { relatoriosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ReportsDashboardProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
}

function parseHourValue(value: string | null | undefined) {
  if (!value) return 0;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseDateTime(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeValue(value?: string | null) {
  const date = parseDateTime(value);
  if (!date) return '--';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatActionLabel(action: string) {
  if (action === 'inicio') return 'Inicio';
  if (action === 'pausa') return 'Pausa';
  if (action === 'retorno') return 'Retorno';
  if (action === 'encerramento') return 'Encerramento';
  return action;
}

function getActionColorClasses(action: string) {
  if (action === 'inicio') return { dot: 'bg-emerald-500', text: 'text-emerald-700' };
  if (action === 'pausa') return { dot: 'bg-amber-500', text: 'text-amber-700' };
  if (action === 'retorno') return { dot: 'bg-sky-500', text: 'text-sky-700' };
  if (action === 'encerramento') return { dot: 'bg-slate-500', text: 'text-slate-700' };
  return { dot: 'bg-slate-300', text: 'text-slate-600' };
}

function getTurnoStatusLabel(status: string) {
  if (status === 'em_atendimento') return 'Em atendimento';
  if (status === 'em_pausa') return 'Em pausa';
  return 'Encerrado';
}

function getTurnoStatusColor(status: string) {
  if (status === 'em_atendimento') return 'bg-green-100 text-green-600';
  if (status === 'em_pausa') return 'bg-amber-100 text-amber-600';
  return 'bg-slate-100 text-slate-500';
}

export default function ReportsDashboard({ onBack, userName, onLogout }: ReportsDashboardProps) {
  const { usuario } = useApp();
  const [dados, setDados] = useState<any>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorReport, setDoctorReport] = useState<any>(null);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [expandedTurnos, setExpandedTurnos] = useState<Record<string, boolean>>({});

  const isGestorMunicipal = usuario?.perfil === 'gestor_municipal';
  const isGestorUPA = usuario?.perfil === 'gestor_upa';

  const fetchDados = useCallback(async () => {
    setErro(null);
    setIsLoading(true);

    try {
      if (isGestorMunicipal && usuario?.municipio_id) {
        const result = await relatoriosApi.municipio(usuario.municipio_id);
        setDados(result);
        return;
      }

      if (isGestorUPA && usuario?.upa_id) {
        const result = await relatoriosApi.upa(usuario.upa_id, mesSelecionado || undefined);
        setDados(result);
        return;
      }

      setDados(null);
      setErro('Nao foi possivel identificar o contexto do relatorio.');
    } catch (error: any) {
      setErro(error?.message || 'Erro ao carregar relatorios.');
      setDados(null);
    } finally {
      setIsLoading(false);
    }
  }, [isGestorMunicipal, isGestorUPA, mesSelecionado, usuario?.municipio_id, usuario?.upa_id]);

  const loadDoctorReport = useCallback(async () => {
    if (!selectedDoctor?.id || !usuario?.upa_id || !isGestorUPA) return;

    setIsDoctorLoading(true);
    setDoctorError(null);

    try {
      const result = await relatoriosApi.medico(usuario.upa_id, selectedDoctor.id, mesSelecionado || undefined);
      setDoctorReport(result);
    } catch (error: any) {
      setDoctorError(error?.message || 'Erro ao carregar o relatorio individual do medico.');
      setDoctorReport(null);
    } finally {
      setIsDoctorLoading(false);
    }
  }, [isGestorUPA, mesSelecionado, selectedDoctor?.id, usuario?.upa_id]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  useEffect(() => {
    if (selectedDoctor?.id) {
      loadDoctorReport();
    }
  }, [loadDoctorReport, selectedDoctor?.id]);

  const municipalEmAtendimento = useMemo(
    () => (dados?.upas ?? []).reduce((acc: number, upa: any) => acc + (upa.em_atendimento || 0), 0),
    [dados?.upas]
  );

  const chartData = useMemo(() => {
    if (isGestorMunicipal) {
      return (dados?.upas ?? []).map((upa: any) => ({
        id: upa.id,
        label: upa.nome,
        value: upa.total_medicos || 0,
        helper: `${upa.em_atendimento || 0} em atendimento`,
        raw: upa,
      }));
    }

    return (dados?.detalhamento ?? []).map((doc: any) => ({
      id: doc.id,
      label: doc.nome,
      value: parseHourValue(doc.total_horas),
      helper: doc.especialidade,
      raw: doc,
    }));
  }, [dados?.detalhamento, dados?.upas, isGestorMunicipal]);

  const maxChartValue = Math.max(...chartData.map((item: any) => item.value), 1);

  const roleName = isGestorMunicipal ? 'Gestor Municipal' : 'Gestor de UPA';
  const subInfo = isGestorMunicipal
    ? usuario?.municipio_nome || 'Relatorios do Municipio'
    : usuario?.upa_nome || 'Relatorios da Unidade';

  const handleExport = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      alert('Nao foi possivel abrir a janela de exportacao.');
      return;
    }

    const headerTitle = isGestorMunicipal ? 'Relatorio Municipal' : 'Relatorio da UPA';
    const headerContext = escapeHtml(subInfo);
    const summaryHtml = isGestorMunicipal
      ? `
        <li>Total de UPAs: ${escapeHtml(String(dados?.total_upas ?? '-'))}</li>
        <li>UPAs ativas: ${escapeHtml(String(dados?.upas_ativas ?? '-'))}</li>
        <li>Total de medicos: ${escapeHtml(String(dados?.total_medicos ?? '-'))}</li>
        <li>Em atendimento agora: ${escapeHtml(String(municipalEmAtendimento))}</li>
      `
      : `
        <li>Medicos ativos: ${escapeHtml(String(dados?.medicos_ativos ?? '-'))}</li>
        <li>Total de horas: ${escapeHtml(String(dados?.total_horas ?? '-'))}</li>
        <li>Taxa de disponibilidade: ${escapeHtml(String(dados?.taxa_disponibilidade ?? '-'))}</li>
      `;

    const detailsHtml = isGestorMunicipal
      ? (dados?.upas ?? [])
          .map(
            (upa: any) => `
              <tr>
                <td>${escapeHtml(upa.nome)}</td>
                <td>${escapeHtml(upa.bairro || '-')}</td>
                <td>${escapeHtml(String(upa.total_medicos || 0))}</td>
                <td>${escapeHtml(String(upa.em_atendimento || 0))}</td>
                <td>${escapeHtml(upa.ativa ? 'Ativa' : 'Inativa')}</td>
              </tr>
            `
          )
          .join('')
      : (dados?.detalhamento ?? [])
          .map(
            (doc: any) => `
              <tr>
                <td>${escapeHtml(doc.nome)}</td>
                <td>${escapeHtml(doc.especialidade || '-')}</td>
                <td>${escapeHtml(doc.total_horas || '-')}</td>
                <td>${escapeHtml(doc.assiduidade || '-')}</td>
                <td>${escapeHtml(doc.status || '-')}</td>
              </tr>
            `
          )
          .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${headerTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1e293b; }
            h1 { margin-bottom: 4px; }
            p { margin-top: 0; color: #64748b; }
            ul { padding-left: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${headerTitle}</h1>
          <p>${headerContext}</p>
          <ul>${summaryHtml}</ul>
          <table>
            <thead>
              <tr>
                ${
                  isGestorMunicipal
                    ? '<th>UPA</th><th>Bairro</th><th>Medicos</th><th>Em atendimento</th><th>Status</th>'
                    : '<th>Profissional</th><th>Especialidade</th><th>Total de horas</th><th>Assiduidade</th><th>Status</th>'
                }
              </tr>
            </thead>
            <tbody>${detailsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleOpenDoctorReport = (doctor: any) => {
    setSelectedDoctor(doctor);
    setDoctorReport(null);
    setDoctorError(null);
    setExpandedTurnos({});
  };

  const handleCloseDoctorReport = () => {
    setSelectedDoctor(null);
    setDoctorReport(null);
    setDoctorError(null);
    setExpandedTurnos({});
  };

  const handleExportDoctor = () => {
    if (!doctorReport) return;

    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      alert('Nao foi possivel abrir a janela de exportacao.');
      return;
    }

    const turnoRows = (doctorReport.turnos ?? [])
      .map(
        (turno: any) => `
          <tr>
            <td>${escapeHtml(getTurnoStatusLabel(turno.status))}</td>
            <td>${escapeHtml(formatDateTimeValue(turno.iniciado_em))}</td>
            <td>${escapeHtml(formatDateTimeValue(turno.encerrado_em))}</td>
            <td>${escapeHtml(turno.duracao_formatada || '-')}</td>
            <td>${escapeHtml(String(turno.registros?.length || 0))}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatorio Individual do Medico</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1e293b; }
            h1 { margin-bottom: 4px; }
            p { margin-top: 0; color: #64748b; }
            ul { padding-left: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Relatorio Individual do Medico</h1>
          <p>${escapeHtml(doctorReport.medico?.nome || 'Medico')} | ${escapeHtml(doctorReport.medico?.especialidade || '-')} | CRM ${escapeHtml(doctorReport.medico?.crm || '-')}</p>
          <p>${escapeHtml(subInfo)}</p>
          <ul>
            <li>Total de horas: ${escapeHtml(String(doctorReport.resumo?.total_horas || '-'))}</li>
            <li>Total de turnos: ${escapeHtml(String(doctorReport.resumo?.total_turnos || 0))}</li>
            <li>Turnos encerrados: ${escapeHtml(String(doctorReport.resumo?.turnos_encerrados || 0))}</li>
            <li>Pausas registradas: ${escapeHtml(String(doctorReport.resumo?.pausas_registradas || 0))}</li>
          </ul>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Inicio</th>
                <th>Encerramento</th>
                <th>Duracao</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>${turnoRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader userName={userName} roleName={roleName} subInfo={subInfo} onLogout={onLogout} onBack={onBack} />

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {isGestorUPA && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <Calendar size={20} className="text-slate-600" />
            <label className="text-sm font-bold text-slate-600">Filtrar por mes:</label>
            <input
              type="month"
              value={mesSelecionado}
              onChange={event => setMesSelecionado(event.target.value)}
              className="px-3 py-1 border border-slate-200 rounded-lg text-sm"
            />
            {mesSelecionado && (
              <button onClick={() => setMesSelecionado('')} className="text-blue-600 text-xs font-bold hover:underline ml-auto">
                Limpar
              </button>
            )}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
            <span className="ml-2 text-sm text-slate-500">Carregando...</span>
          </div>
        )}

        <div className={`grid grid-cols-1 ${isGestorMunicipal ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          {isGestorMunicipal ? (
            <>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.total_upas ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">UPAs Cadastradas</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.upas_ativas ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">UPAs Ativas</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.total_medicos ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Medicos Vinculados</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{municipalEmAtendimento}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Em Atendimento Agora</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.medicos_ativos ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Medicos Ativos no Mes</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Timer size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.total_horas ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Total de Horas em Plantao</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                  <History size={24} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{dados?.taxa_disponibilidade ?? '-'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Taxa de Disponibilidade</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isGestorMunicipal ? 'Distribuicao de Medicos por UPA' : 'Carga Horaria por Profissional'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {isGestorMunicipal
                  ? 'Comparativo entre as unidades do municipio.'
                  : 'Clique em um medico para abrir o relatorio individual do periodo.'}
              </p>
            </div>
            <button
              onClick={handleExport}
              className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              <span className="font-bold text-[10px] uppercase">Exportar</span>
            </button>
          </div>

          {chartData.length > 0 ? (
            <>
              <div className="h-56 flex items-end justify-between gap-2">
                {chartData.map((item: any, index: number) => (
                  <motion.button
                    key={item.id ?? index}
                    type="button"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(10, (item.value / maxChartValue) * 100)}%` }}
                    transition={{ delay: index * 0.04, duration: 0.6 }}
                    className={`flex-1 rounded-t-lg transition-colors relative group min-w-0 ${
                      isGestorMunicipal ? 'bg-blue-100 cursor-default' : 'bg-blue-100 hover:bg-blue-500 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isGestorMunicipal) handleOpenDoctorReport(item.raw);
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.value} {isGestorMunicipal ? 'medicos' : 'horas'}
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {chartData.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!isGestorMunicipal) handleOpenDoctorReport(item.raw);
                    }}
                    className={`rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-left ${
                      isGestorMunicipal ? 'cursor-default' : 'hover:border-blue-200 transition-all'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-700 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.helper}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400 text-sm py-8">Nenhum dado grafico disponivel para o periodo.</p>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={20} className="text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800">
              {isGestorMunicipal ? 'Detalhamento por UPA' : 'Detalhamento por Profissional'}
            </h3>
          </div>

          <div className="space-y-4">
            {isGestorMunicipal ? (
              !isLoading && (!(dados?.upas ?? []).length) ? (
                <p className="text-center text-slate-400 text-sm py-4">Nenhuma UPA encontrada para este municipio.</p>
              ) : (
                (dados?.upas ?? []).map((upa: any) => (
                  <div key={upa.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{upa.nome}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{upa.bairro || 'Sem bairro'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{upa.total_medicos}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medicos</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-emerald-600">{upa.em_atendimento}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Em atendimento</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          upa.ativa ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {upa.ativa ? 'Ativa' : 'Inativa'}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : !isLoading && (!dados?.detalhamento || dados.detalhamento.length === 0) ? (
              <p className="text-center text-slate-400 text-sm py-4">Nenhum medico no periodo selecionado.</p>
            ) : (
              (dados?.detalhamento ?? []).map((doc: any) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleOpenDoctorReport(doc)}
                  aria-label={`Ver relatorio de ${doc.nome}`}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{doc.nome}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.especialidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{doc.total_horas}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Mes</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-emerald-600">{doc.assiduidade}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assiduidade</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {doc.status}
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleCloseDoctorReport}>
          <div
            className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100"
            onClick={event => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4 z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Relatorio Individual</p>
                <h3 className="text-2xl font-black text-slate-800">{doctorReport?.medico?.nome || selectedDoctor.nome}</h3>
                <p className="text-sm text-slate-500">
                  {doctorReport?.medico?.especialidade || selectedDoctor.especialidade || '-'} | {subInfo}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDoctorReport}
                className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Relatorio Individual do Medico</h4>
                  <p className="text-sm text-slate-400">Resumo e turnos do periodo selecionado.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDoctor}
                  disabled={!doctorReport}
                  className="px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:bg-slate-300 flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar medico
                </button>
              </div>

              {doctorError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                  {doctorError}
                </div>
              )}

              {isDoctorLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                  <span className="ml-2 text-sm text-slate-500">Carregando relatorio do medico...</span>
                </div>
              ) : doctorReport ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-800">{doctorReport.resumo?.total_horas || '-'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total de horas</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-800">{doctorReport.resumo?.total_turnos ?? 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Turnos no periodo</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-800">{doctorReport.resumo?.turnos_encerrados ?? 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Turnos encerrados</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-800">{doctorReport.resumo?.pausas_registradas ?? 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pausas</p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome</p>
                        <p className="mt-1 font-bold text-slate-800">{doctorReport.medico?.nome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Especialidade</p>
                        <p className="mt-1 font-bold text-slate-800">{doctorReport.medico?.especialidade}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">CRM</p>
                        <p className="mt-1 font-bold text-slate-800">{doctorReport.medico?.crm || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 size={18} className="text-slate-400" />
                      <h5 className="text-lg font-bold text-slate-800">Turnos do periodo</h5>
                    </div>

                    {doctorReport.turnos?.length ? (
                      doctorReport.turnos.map((turno: any) => {
                        const isExpanded = Boolean(expandedTurnos[String(turno.id)]);

                        return (
                          <div key={turno.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTurnos(prev => ({
                                  ...prev,
                                  [String(turno.id)]: !prev[String(turno.id)],
                                }))
                              }
                              className="w-full flex items-start justify-between gap-4 text-left"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTurnoStatusColor(turno.status)}`}>
                                    {getTurnoStatusLabel(turno.status)}
                                  </span>
                                  <p className="text-sm font-bold text-slate-800">{formatDateTimeValue(turno.iniciado_em)}</p>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                  Duracao: {turno.duracao_formatada || '-'} | Registros: {turno.registros?.length || 0}
                                </p>
                                {turno.encerrado_em && (
                                  <p className="mt-1 text-xs text-slate-400">Encerrado em {formatDateTimeValue(turno.encerrado_em)}</p>
                                )}
                              </div>
                              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div className="mt-5 pt-5 border-t border-slate-100">
                                <h6 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Detalhes dos registros</h6>
                                {turno.registros?.length ? (
                                  <div className="space-y-4">
                                    {turno.registros.map((registro: any, index: number) => {
                                      const color = getActionColorClasses(registro.acao);

                                      return (
                                        <div key={registro.id || `${turno.id}-${index}`} className="relative pl-8">
                                          <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white ${color.dot}`} />
                                          <p className={`text-sm font-bold ${color.text}`}>{formatActionLabel(registro.acao)}</p>
                                          <p className="text-xs text-slate-400">{formatDateTimeValue(registro.registrado_em)}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400">Nenhum registro detalhado disponivel.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400">Nenhum turno encontrado para este medico no periodo selecionado.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
