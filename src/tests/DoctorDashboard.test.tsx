import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import DoctorDashboard from '../components/DoctorDashboard';
import { turnosApi } from '../services/api';

vi.mock('../services/api', () => ({
  turnosApi: {
    meu: vi.fn(),
    meuHistorico: vi.fn(),
    iniciar: vi.fn(),
    pausar: vi.fn(),
    retornar: vi.fn(),
    encerrar: vi.fn(),
    listar: vi.fn(),
  },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ usuario: { upa_id: 1 }, logout: vi.fn() }),
}));

const mockedTurnosApi = turnosApi as any;

const defaultMeuPayload = () => ({
  medico: { nome: 'Dr. Teste', crm: '12345' },
  turno: { status: 'em_atendimento' },
  historico: [],
  turno_pendente_anterior: null,
  historico_outros_dias: [],
});

const pendingTurnoPayload = () => ({
  medico: { nome: 'Dr. Teste', crm: '12345' },
  turno: null,
  historico: [],
  turno_pendente_anterior: {
    id: 9,
    status: 'em_pausa',
    iniciado_em: '2026-04-13T08:00:00-03:00',
    registros: [
      { acao: 'inicio', registrado_em: '2026-04-13T08:00:00-03:00' },
      { acao: 'pausa', registrado_em: '2026-04-13T12:00:00-03:00' },
    ],
  },
  historico_outros_dias: [],
});

const historicoOutrosDiasPayload = () => ({
  ...defaultMeuPayload(),
  historico_outros_dias: [
    {
      id: 21,
      status: 'encerrado',
      iniciado_em: '2026-04-12T08:00:00-03:00',
      encerrado_em: '2026-04-12T14:30:00-03:00',
      duracao_formatada: '6h 30m',
      registros: [
        { acao: 'inicio', registrado_em: '2026-04-12T08:00:00-03:00' },
        { acao: 'pausa', registrado_em: '2026-04-12T11:00:00-03:00' },
        { acao: 'retorno', registrado_em: '2026-04-12T11:30:00-03:00' },
        { acao: 'encerramento', registrado_em: '2026-04-12T14:30:00-03:00' },
      ],
    },
  ],
});

const historicoOutrosDiasComQuatroItensPayload = () => ({
  ...defaultMeuPayload(),
  historico_outros_dias: [
    {
      id: 31,
      status: 'encerrado',
      iniciado_em: '2026-04-14T08:00:00-03:00',
      encerrado_em: '2026-04-14T12:00:00-03:00',
      duracao_formatada: '4h',
      registros: [{ acao: 'inicio', registrado_em: '2026-04-14T08:00:00-03:00' }],
    },
    {
      id: 32,
      status: 'encerrado',
      iniciado_em: '2026-04-13T08:00:00-03:00',
      encerrado_em: '2026-04-13T12:00:00-03:00',
      duracao_formatada: '4h',
      registros: [{ acao: 'inicio', registrado_em: '2026-04-13T08:00:00-03:00' }],
    },
    {
      id: 33,
      status: 'encerrado',
      iniciado_em: '2026-04-12T08:00:00-03:00',
      encerrado_em: '2026-04-12T12:00:00-03:00',
      duracao_formatada: '4h',
      registros: [{ acao: 'inicio', registrado_em: '2026-04-12T08:00:00-03:00' }],
    },
    {
      id: 34,
      status: 'encerrado',
      iniciado_em: '2026-04-11T08:00:00-03:00',
      encerrado_em: '2026-04-11T12:00:00-03:00',
      duracao_formatada: '4h',
      registros: [{ acao: 'inicio', registrado_em: '2026-04-11T08:00:00-03:00' }],
    },
  ],
});

const defaultProps = {
  userName: 'Dr. Teste',
  onLogout: vi.fn(),
  onNavigate: vi.fn(),
};

describe('DoctorDashboard â€” polling 15s', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockedTurnosApi.meu.mockResolvedValue(defaultMeuPayload());
    mockedTurnosApi.iniciar.mockResolvedValue({});
    mockedTurnosApi.pausar.mockResolvedValue({});
    mockedTurnosApi.retornar.mockResolvedValue({});
    mockedTurnosApi.encerrar.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Test 1: setInterval criado com 15000ms ao montar o componente', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    const pollingCall = setIntervalSpy.mock.calls.find(call => call[1] === 15000);
    expect(pollingCall).toBeDefined();
  });

  it('Test 2: clearInterval chamado ao desmontar', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('Test 3: fetchTurno silencioso nao altera isActionLoading durante polling', async () => {
    const { queryByRole } = render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    const loadingIndicator = queryByRole('progressbar');
    expect(loadingIndicator).toBeNull();
  });

  it('Test 4: indicador de ultima atualizacao visivel apos o mount', async () => {
    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Atualizado/)).toBeInTheDocument();
  });

  it('Test 5: timer de relogio (60s) ainda funciona em paralelo ao polling de dados', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    const pollingTimer = setIntervalSpy.mock.calls.find(call => call[1] === 15000);
    const clockTimer = setIntervalSpy.mock.calls.find(call => call[1] === 60000);

    expect(pollingTimer).toBeDefined();
    expect(clockTimer).toBeDefined();
  });

  it('Test 6: exibe turno pendente anterior e bloqueia novo inicio', async () => {
    mockedTurnosApi.meu.mockResolvedValueOnce(pendingTurnoPayload());

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Existe um turno aberto de dia anterior')).toBeInTheDocument();
    expect(screen.getByText('RESOLVER TURNO PENDENTE')).toBeInTheDocument();
  });

  it('Test 7: envia encerramento retroativo com turno_id e encerrado_em', async () => {
    mockedTurnosApi.meu
      .mockResolvedValueOnce(pendingTurnoPayload())
      .mockResolvedValue({ ...pendingTurnoPayload(), turno_pendente_anterior: null });

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText('RESOLVER TURNO PENDENTE'));

    fireEvent.change(screen.getByLabelText('Data e hora do encerramento'), {
      target: { value: '2026-04-13T13:30' },
    });

    fireEvent.click(screen.getByText('CONFIRMAR ENCERRAMENTO'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedTurnosApi.encerrar).toHaveBeenCalledWith({
      turno_id: 9,
      encerrado_em: '2026-04-13T13:30',
    });
  });

  it('Test 8: se iniciar falhar sem payload estruturado, consulta meu turno e abre a modal', async () => {
    mockedTurnosApi.meu
      .mockResolvedValueOnce(defaultMeuPayload())
      .mockResolvedValueOnce(pendingTurnoPayload());
    mockedTurnosApi.iniciar.mockRejectedValue(new Error('Existe um turno pendente de dia anterior.'));

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText('INICIAR TURNO'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedTurnosApi.meu).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Encerrar turno pendente')).toBeInTheDocument();
    expect(screen.getByLabelText('Data e hora do encerramento')).toBeInTheDocument();
  });

  it('Test 9: exibe historico de outros dias quando o payload retorna turnos encerrados', async () => {
    mockedTurnosApi.meu.mockResolvedValueOnce(historicoOutrosDiasPayload());

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Historico de Outros Dias')).toBeInTheDocument();
    expect(screen.getByText('12/04/2026')).toBeInTheDocument();
    expect(screen.getByText('6h 30m')).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
  });

  it('Test 10: expande os detalhes dos registros ao clicar no card do historico', async () => {
    mockedTurnosApi.meu.mockResolvedValueOnce(historicoOutrosDiasPayload());

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText('12/04/2026'));

    expect(screen.getByText('Detalhes dos registros')).toBeInTheDocument();
    expect(screen.getAllByText('Inicio do turno').length).toBeGreaterThan(0);
    expect(screen.getByText('Pausa')).toBeInTheDocument();
    expect(screen.getByText('Retorno')).toBeInTheDocument();
  });

  it('Test 11: mostra so 3 itens no resumo e permite navegar para o historico completo', async () => {
    mockedTurnosApi.meu.mockResolvedValueOnce(historicoOutrosDiasComQuatroItensPayload());

    render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('14/04/2026')).toBeInTheDocument();
    expect(screen.getByText('13/04/2026')).toBeInTheDocument();
    expect(screen.getByText('12/04/2026')).toBeInTheDocument();
    expect(screen.queryByText('11/04/2026')).toBeNull();

    fireEvent.click(screen.getByText('Ver historico completo'));

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('doctor_history');
  });
});
