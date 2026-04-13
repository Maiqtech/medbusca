import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import DoctorDashboard from '../components/DoctorDashboard';

vi.mock('../services/api', () => ({
  turnosApi: {
    meu: vi.fn().mockResolvedValue({
      medico: { nome: 'Dr. Teste', crm: '12345' },
      turno: { status: 'em_atendimento' },
      historico: [],
    }),
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

const defaultProps = {
  userName: 'Dr. Teste',
  onLogout: vi.fn(),
};

describe('DoctorDashboard — polling 15s', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it('Test 3: fetchTurno silencioso não altera isActionLoading durante polling', async () => {
    const { queryByRole } = render(<DoctorDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    // Advance 15 seconds to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    // No loading spinner/disabled state from polling
    const loadingIndicator = queryByRole('progressbar');
    expect(loadingIndicator).toBeNull();
  });

  it('Test 4: indicador de última atualização visível após o mount (contém "Atualizado às")', async () => {
    render(<DoctorDashboard {...defaultProps} />);

    // Flush pending microtasks so the mock resolved promise settles and state updates
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument();
  });

  it('Test 5: timer de relógio (60s) ainda funciona em paralelo ao polling de dados', async () => {
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
});
