import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShiftMonitoring from '../components/ShiftMonitoring';
import { turnosApi } from '../services/api';

vi.mock('../services/api', () => ({
  turnosApi: {
    listar: vi.fn(),
  },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ usuario: { upa_id: 42 } }),
}));

const mockedTurnosApi = turnosApi as any;

const payload = [
  {
    id: 1,
    medico: 1,
    medico_nome: 'Dr. Joao Silva',
    especialidade_nome: 'Ortopedia',
    status: 'em_atendimento',
    iniciado_em: '2026-04-14T09:00:00-03:00',
    encerrado_em: null,
    registros: [
      { id: 11, acao: 'inicio', registrado_em: '2026-04-14T09:00:00-03:00' },
    ],
  },
  {
    id: 2,
    medico: 2,
    medico_nome: 'Dra. Maria Souza',
    especialidade_nome: 'Pediatria',
    status: 'em_pausa',
    iniciado_em: '2026-04-14T08:00:00-03:00',
    encerrado_em: null,
    registros: [
      { id: 21, acao: 'inicio', registrado_em: '2026-04-14T08:00:00-03:00' },
      { id: 22, acao: 'pausa', registrado_em: '2026-04-14T10:00:00-03:00' },
    ],
  },
  {
    id: 3,
    medico: 3,
    medico_nome: 'Dr. Carlos Lima',
    especialidade_nome: 'Clinico Geral',
    status: 'encerrado',
    iniciado_em: '2026-04-14T06:00:00-03:00',
    encerrado_em: '2026-04-14T10:30:00-03:00',
    registros: [
      { id: 31, acao: 'inicio', registrado_em: '2026-04-14T06:00:00-03:00' },
      { id: 32, acao: 'encerramento', registrado_em: '2026-04-14T10:30:00-03:00' },
    ],
  },
];

const defaultProps = {
  onBack: vi.fn(),
  userName: 'Gestor Teste',
  onLogout: vi.fn(),
  upaName: 'UPA Teste',
};

describe('ShiftMonitoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00-03:00'));
    vi.clearAllMocks();
    mockedTurnosApi.listar.mockResolvedValue(payload);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('carrega turnos reais da UPA', async () => {
    render(<ShiftMonitoring {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedTurnosApi.listar).toHaveBeenCalledWith({ upa_id: 42 });
    expect(screen.getByText('Dr. Joao Silva')).toBeInTheDocument();
    expect(screen.getByText('Dra. Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('Dr. Carlos Lima')).toBeInTheDocument();
    expect(screen.getByText('3h')).toBeInTheDocument();
  });

  it('expande os registros reais do turno', async () => {
    render(<ShiftMonitoring {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getAllByLabelText('Mostrar registros do turno')[0]);

    expect(screen.getByText('Detalhes dos registros')).toBeInTheDocument();
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
  });
});
