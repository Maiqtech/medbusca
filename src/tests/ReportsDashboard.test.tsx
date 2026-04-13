import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ReportsDashboard from '../components/ReportsDashboard';

vi.mock('../services/api', () => ({
  relatoriosApi: {
    upa: vi.fn().mockResolvedValue({
      medicos_ativos: 8,
      total_horas: '320h',
      taxa_disponibilidade: '87%',
      detalhamento: [
        {
          id: 1,
          nome: 'Dr. X',
          especialidade: 'Clínico',
          total_horas: '10h',
          assiduidade: '90%',
          status: 'Online',
        },
      ],
    }),
  },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ usuario: { upa_id: 42 } }),
}));

const defaultProps = {
  userName: 'Gestor',
  onBack: vi.fn(),
  onLogout: vi.fn(),
};

describe('ReportsDashboard — API integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Test 1: no mount, relatoriosApi.upa é chamado com usuario.upa_id (42)', async () => {
    const { relatoriosApi } = await import('../services/api');
    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(relatoriosApi.upa).toHaveBeenCalledWith(42, undefined);
  });

  it('Test 2: ao mudar o filtro de mês para "2026-04", relatoriosApi.upa é chamado com (42, "2026-04")', async () => {
    const { relatoriosApi } = await import('../services/api');
    render(<ReportsDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    const monthInput = screen.getByDisplayValue('');
    fireEvent.change(monthInput, { target: { value: '2026-04' } });

    await act(async () => {
      await Promise.resolve();
    });

    expect(relatoriosApi.upa).toHaveBeenLastCalledWith(42, '2026-04');
  });

  it('Test 3: loading visível no início; após fetch, dados da API aparecem na tela', async () => {
    const { relatoriosApi } = (await import('../services/api')) as any;

    let resolvePromise!: (value: any) => void;
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    relatoriosApi.upa.mockReturnValueOnce(controlledPromise);

    render(<ReportsDashboard {...defaultProps} />);

    // Loading indicator should be visible before fetch resolves
    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    // Resolve the fetch
    resolvePromise({
      medicos_ativos: 8,
      total_horas: '320h',
      taxa_disponibilidade: '87%',
      detalhamento: [
        {
          id: 1,
          nome: 'Dr. X',
          especialidade: 'Clínico',
          total_horas: '10h',
          assiduidade: '90%',
          status: 'Online',
        },
      ],
    });

    await act(async () => {
      await Promise.resolve();
    });

    // After fetch, data should be visible
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/Dr\. X/)).toBeInTheDocument();
  });
});
