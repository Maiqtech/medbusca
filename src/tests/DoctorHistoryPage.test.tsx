import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import DoctorHistoryPage from '../components/DoctorHistoryPage';
import { turnosApi } from '../services/api';

vi.mock('../services/api', () => ({
  turnosApi: {
    meuHistorico: vi.fn(),
  },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ logout: vi.fn() }),
}));

const mockedTurnosApi = turnosApi as any;

const historicoPayload = {
  medico: {
    nome: 'Dr. Teste',
    crm: '12345',
    especialidade_nome: 'Clinica Geral',
    upa_nome: 'UPA Central',
  },
  historico: [
    {
      id: 1,
      status: 'encerrado',
      iniciado_em: '2026-04-14T08:00:00-03:00',
      encerrado_em: '2026-04-14T12:30:00-03:00',
      duracao_formatada: '4h 30m',
      registros: [
        { acao: 'inicio', registrado_em: '2026-04-14T08:00:00-03:00' },
        { acao: 'encerramento', registrado_em: '2026-04-14T12:30:00-03:00' },
      ],
    },
  ],
};

describe('DoctorHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTurnosApi.meuHistorico.mockResolvedValue(historicoPayload);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carrega o historico completo e expande os registros', async () => {
    render(<DoctorHistoryPage userName="Dr. Teste" onBack={vi.fn()} onLogout={vi.fn()} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Historico Completo')).toBeInTheDocument();
    expect(screen.getByText('14/04/2026')).toBeInTheDocument();
    expect(screen.getByText('4h 30m')).toBeInTheDocument();

    fireEvent.click(screen.getByText('14/04/2026'));

    expect(screen.getByText('Detalhes dos registros')).toBeInTheDocument();
    expect(screen.getAllByText('Inicio do turno').length).toBeGreaterThan(0);
    expect(screen.getByText('Encerramento')).toBeInTheDocument();
  });

  it('abre a janela de impressao ao exportar em PDF', async () => {
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write, close },
      focus,
      print,
    } as any);

    render(<DoctorHistoryPage userName="Dr. Teste" onBack={vi.fn()} onLogout={vi.fn()} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText('Exportar em PDF'));

    expect(window.open).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });
});
