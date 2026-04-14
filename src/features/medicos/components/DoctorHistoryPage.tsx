import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Download, History as HistoryIcon } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { turnosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface DoctorHistoryPageProps {
  userName: string;
  onBack: () => void;
  onLogout: () => void;
  systemName?: string;
  systemLogo?: string;
}

interface TurnoRegistro {
  acao: string;
  registrado_em: string;
}

interface TurnoHistorico {
  id: number;
  status: string;
  iniciado_em: string;
  encerrado_em: string | null;
  duracao_formatada?: string | null;
  registros?: TurnoRegistro[];
}

function formatTimeValue(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateValue(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTimeValue(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatActionLabel(acao: string) {
  if (acao === 'inicio') return 'Inicio do turno';
  if (acao === 'pausa') return 'Pausa';
  if (acao === 'retorno') return 'Retorno';
  return 'Encerramento';
}

function getActionColorClasses(acao: string) {
  if (acao === 'inicio') return { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
  if (acao === 'pausa') return { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' };
  if (acao === 'retorno') return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
  return { dot: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-100' };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function DoctorHistoryPage({
  userName,
  onBack,
  onLogout,
  systemName,
  systemLogo,
}: DoctorHistoryPageProps) {
  const { logout } = useApp();
  const [medico, setMedico] = useState<any>(null);
  const [historico, setHistorico] = useState<TurnoHistorico[]>([]);
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    turnosApi
      .meuHistorico()
      .then((data: any) => {
        if (!ativo) return;
        setMedico(data.medico);
        setHistorico(data.historico || []);
      })
      .catch((error: any) => {
        if (!ativo) return;
        setErro(error.message || 'Nao foi possivel carregar o historico.');
      })
      .finally(() => {
        if (ativo) setIsLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = useMemo(() => {
    const totalRegistros = historico.reduce((acc, turno) => acc + (turno.registros?.length || 0), 0);
    return {
      totalTurnos: historico.length,
      totalRegistros,
    };
  }, [historico]);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      alert('Nao foi possivel abrir a janela de exportacao. Verifique o bloqueador de pop-up.');
      return;
    }

    const medicoNome = escapeHtml(medico?.nome || userName);
    const crm = escapeHtml(medico?.crm || '---');
    const especialidade = escapeHtml(medico?.especialidade_nome || '---');
    const upa = escapeHtml(medico?.upa_nome || '---');
    const geradoEm = escapeHtml(formatDateTimeValue(new Date().toISOString()));

    const turnosHtml = historico
      .map(turno => {
        const registros = (turno.registros || [])
          .map(
            registro =>
              `<li><strong>${escapeHtml(formatActionLabel(registro.acao))}</strong> - ${escapeHtml(formatDateTimeValue(registro.registrado_em))}</li>`
          )
          .join('');

        return `
          <section class="turno">
            <div class="cabecalho">
              <div>
                <h3>${escapeHtml(formatDateValue(turno.iniciado_em))}</h3>
                <p>${escapeHtml(formatTimeValue(turno.iniciado_em))}${turno.encerrado_em ? ` ate ${escapeHtml(formatTimeValue(turno.encerrado_em))}` : ''}</p>
              </div>
              <div class="meta">
                <span>Status: ${escapeHtml(turno.status)}</span>
                <span>Duracao: ${escapeHtml(turno.duracao_formatada || '--')}</span>
              </div>
            </div>
            <ul>${registros}</ul>
          </section>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Historico de Turnos</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; margin: 32px; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            h2 { margin: 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; }
            p { margin: 4px 0; }
            .hero { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-top: 16px; }
            .turno { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
            .cabecalho { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
            .cabecalho h3 { margin: 0 0 4px; font-size: 18px; }
            .meta { text-align: right; font-size: 12px; color: #475569; }
            ul { margin: 0; padding-left: 20px; }
            li { margin: 6px 0; }
          </style>
        </head>
        <body>
          <section class="hero">
            <h2>MedBusca</h2>
            <h1>Historico Completo de Turnos</h1>
            <p>Gerado em ${geradoEm}</p>
            <div class="meta-grid">
              <p><strong>Medico:</strong> ${medicoNome}</p>
              <p><strong>CRM:</strong> ${crm}</p>
              <p><strong>Especialidade:</strong> ${especialidade}</p>
              <p><strong>UPA:</strong> ${upa}</p>
            </div>
          </section>
          ${turnosHtml || '<p>Nenhum turno encerrado encontrado.</p>'}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DashboardHeader
        userName={medico?.nome || userName}
        roleName="Medico"
        subInfo={`CRM: ${medico?.crm || '---'}`}
        onLogout={handleLogout}
        onBack={onBack}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Historico Completo</h2>
            <p className="text-slate-500 text-sm font-medium">Consulte seus turnos anteriores e exporte em PDF.</p>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:bg-blue-400"
          >
            <Download size={18} />
            Exportar em PDF
          </button>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <motion.div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <HistoryIcon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">{isLoading ? '--' : resumo.totalTurnos}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Turnos encerrados</p>
          </motion.div>

          <motion.div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <Clock size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">{isLoading ? '--' : resumo.totalRegistros}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registros totais</p>
          </motion.div>
        </section>

        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HistoryIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Turnos Encerrados</h3>
          </div>

          {erro && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 mb-4">
              {erro}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-sm text-slate-400 py-8">Carregando historico...</p>
          ) : historico.length > 0 ? (
            <div className="space-y-4">
              {historico.map(turno => {
                const expandido = expandedTurnoId === turno.id;
                return (
                  <div key={turno.id} className="rounded-[2rem] border border-slate-100 bg-slate-50/80 p-5 space-y-4">
                    <button
                      type="button"
                      onClick={() => setExpandedTurnoId(expandido ? null : turno.id)}
                      className="w-full flex items-start justify-between gap-4 text-left"
                    >
                      <div>
                        <p className="text-base font-black text-slate-800">{formatDateValue(turno.iniciado_em)}</p>
                        <p className="text-sm text-slate-500">
                          {formatTimeValue(turno.iniciado_em)}
                          {turno.encerrado_em ? ` ate ${formatTimeValue(turno.encerrado_em)}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Duracao</p>
                          <p className="text-sm font-black text-slate-700">{turno.duracao_formatada || '--'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-500 flex items-center justify-center">
                          {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </button>

                    {expandido && (
                      <div className="rounded-[1.5rem] bg-white border border-slate-100 p-4 space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Detalhes dos registros
                        </p>
                        {turno.registros?.length ? (
                          <div className="space-y-3 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {turno.registros.map((registro, index) => (
                              <div key={`${turno.id}-${index}`} className="relative flex items-center justify-between gap-4 pl-7">
                                <div
                                  className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white ${getActionColorClasses(registro.acao).dot}`}
                                />
                                <p
                                  className={`text-sm font-bold ${getActionColorClasses(registro.acao).text}`}
                                >
                                  {formatActionLabel(registro.acao)}
                                </p>
                                <span className="text-xs font-black text-slate-400 tabular-nums">
                                  {formatDateTimeValue(registro.registrado_em)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Nenhum registro detalhado disponivel.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-300 py-4 font-medium italic">
              Nenhum turno encerrado encontrado no historico.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
