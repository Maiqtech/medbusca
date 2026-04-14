import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportsDashboard from '../components/ReportsDashboard';
import { relatoriosApi } from '../services/api';

const mockedUser: any = {
  perfil: 'gestor_upa',
  upa_id: 42,
  upa_nome: 'UPA Central',
  municipio_id: null,
  municipio_nome: null,
};

vi.mock('../services/api', () => ({
  relatoriosApi: {
    upa: vi.fn(),
    medico: vi.fn(),
    municipio: vi.fn(),
  },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ usuario: mockedUser }),
}));

const mockedRelatoriosApi = relatoriosApi as any;

const upaPayload = {
  medicos_ativos: 8,
  total_horas: '320h',
  taxa_disponibilidade: '87%',
  detalhamento: [
    {
      id: 1,
      nome: 'Dr. X',
      especialidade: 'Clinico',
      total_horas: '10h',
      assiduidade: '90%',
      status: 'Online',
    },
  ],
};

const doctorPayload = {
  medico: {
    id: 1,
    nome: 'Dr. X',
    crm: 'CRM123',
    especialidade: 'Clinico',
    status: 'Online',
  },
  resumo: {
    total_horas: '10h',
    total_turnos: 2,
    turnos_encerrados: 1,
    pausas_registradas: 1,
  },
  turnos: [
    {
      id: 10,
      status: 'encerrado',
      iniciado_em: '2026-04-10T08:00:00-03:00',
      encerrado_em: '2026-04-10T14:00:00-03:00',
      duracao_formatada: '6h',
      registros: [
        { id: 101, acao: 'inicio', registrado_em: '2026-04-10T08:00:00-03:00' },
        { id: 102, acao: 'encerramento', registrado_em: '2026-04-10T14:00:00-03:00' },
      ],
    },
  ],
};

const municipioPayload = {
  total_upas: 3,
  upas_ativas: 2,
  total_medicos: 18,
  upas: [
    { id: 1, nome: 'UPA Pituaçu', bairro: 'Pituaçu', ativa: true, total_medicos: 8, em_atendimento: 3 },
    { id: 2, nome: 'UPA Itapuã', bairro: 'Itapuã', ativa: false, total_medicos: 5, em_atendimento: 1 },
  ],
};

const defaultProps = {
  userName: 'Gestor',
  onBack: vi.fn(),
  onLogout: vi.fn(),
};

describe('ReportsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUser.perfil = 'gestor_upa';
    mockedUser.upa_id = 42;
    mockedUser.upa_nome = 'UPA Central';
    mockedUser.municipio_id = null;
    mockedUser.municipio_nome = null;

    mockedRelatoriosApi.upa.mockResolvedValue(upaPayload);
    mockedRelatoriosApi.medico.mockResolvedValue(doctorPayload);
    mockedRelatoriosApi.municipio.mockResolvedValue(municipioPayload);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('carrega relatorio de UPA no mount', async () => {
    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRelatoriosApi.upa).toHaveBeenCalledWith(42, undefined);
    expect(screen.getByText('Medicos Ativos no Mes')).toBeInTheDocument();
    expect(screen.getAllByText(/Dr\. X/).length).toBeGreaterThan(0);
  });

  it('refaz a busca de UPA ao mudar o mes', async () => {
    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2026-04' } });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRelatoriosApi.upa).toHaveBeenLastCalledWith(42, '2026-04');
  });

  it('carrega relatorio municipal quando o usuario e gestor municipal', async () => {
    mockedUser.perfil = 'gestor_municipal';
    mockedUser.municipio_id = 7;
    mockedUser.municipio_nome = 'Salvador';
    mockedUser.upa_id = null;
    mockedUser.upa_nome = null;

    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRelatoriosApi.municipio).toHaveBeenCalledWith(7);
    expect(mockedRelatoriosApi.upa).not.toHaveBeenCalled();
    expect(screen.getByText('UPAs Cadastradas')).toBeInTheDocument();
    expect(screen.getByText('Detalhamento por UPA')).toBeInTheDocument();
    expect(screen.getAllByText('UPA Pituaçu').length).toBeGreaterThan(0);
  });

  it('nao mostra filtro por mes para gestor municipal', async () => {
    mockedUser.perfil = 'gestor_municipal';
    mockedUser.municipio_id = 7;
    mockedUser.municipio_nome = 'Salvador';
    mockedUser.upa_id = null;

    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('Filtrar por mes:')).toBeNull();
  });

  it('abre o relatorio individual do medico para gestor upa', async () => {
    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: /ver relatorio de dr\. x/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRelatoriosApi.medico).toHaveBeenCalledWith(42, 1, undefined);
    expect(screen.getByText('Relatorio Individual do Medico')).toBeInTheDocument();
    expect(screen.getByText('Turnos do periodo')).toBeInTheDocument();
  });
});
