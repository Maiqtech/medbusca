import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitizenPortal from '../components/CitizenPortal';

// Mock motion/react to avoid animation complexity in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../services/api', () => ({
  municipiosApi: { listar: vi.fn().mockResolvedValue([{ id: 1, nome: 'Salvador', uf: 'BA' }]) },
  especialidadesApi: { listar: vi.fn().mockResolvedValue([{ id: 2, nome: 'Clínica Geral' }]) },
  upasApi: { listar: vi.fn() },
}));

import { municipiosApi, especialidadesApi, upasApi } from '../services/api';

const UPA_COM_COORDENADAS = {
  id: 1,
  nome: 'UPA Brotas',
  bairro: 'Brotas',
  municipio_nome: 'Salvador',
  latitude: '-12.9714',
  longitude: '-38.5014',
  especialidades: [{ id: 2, nome: 'Clínica Geral' }],
  status_especialidade: { disponivel: true, proximo_turno: null },
};

const UPA_SEM_COORDENADAS = {
  id: 2,
  nome: 'UPA Nordeste',
  bairro: 'Nordeste',
  municipio_nome: 'Salvador',
  latitude: null,
  longitude: null,
  especialidades: [{ id: 2, nome: 'Clínica Geral' }],
  status_especialidade: { disponivel: false, proximo_turno: null },
};

const mockUpasListar = vi.mocked(upasApi.listar);
const mockMunicipiosListar = vi.mocked(municipiosApi.listar);
const mockEspecialidadesListar = vi.mocked(especialidadesApi.listar);

async function renderAndSearch(upas: any[]) {
  mockUpasListar.mockResolvedValue(upas);
  render(<CitizenPortal onBack={vi.fn()} />);

  // Wait for selects to load
  await waitFor(() => {
    expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
  });

  // Select município
  const munSelect = screen.getByDisplayValue('Selecione o município');
  await userEvent.selectOptions(munSelect, '1');

  // Select especialidade
  const espSelect = screen.getByDisplayValue('Qual atendimento você busca?');
  await userEvent.selectOptions(espSelect, '2');

  // Click buscar
  await userEvent.click(screen.getByText('BUSCAR ATENDIMENTO'));

  // Wait for results
  await waitFor(() => {
    expect(mockUpasListar).toHaveBeenCalled();
  });
}

describe('CitizenPortal — Polling', () => {
  beforeEach(() => {
    mockUpasListar.mockReset();
    mockMunicipiosListar.mockResolvedValue([{ id: 1, nome: 'Salvador', uf: 'BA' }]);
    mockEspecialidadesListar.mockResolvedValue([{ id: 2, nome: 'Clínica Geral' }]);
  });

  it('Test 1: não cria setInterval antes da primeira busca (results === null)', async () => {
    mockUpasListar.mockResolvedValue([UPA_COM_COORDENADAS]);

    render(<CitizenPortal onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    // upasApi.listar should never be called when no search has happened
    expect(mockUpasListar).not.toHaveBeenCalled();
  });

  it('Test 2: cria setInterval de 10000ms após busca bem-sucedida (results !== null)', async () => {
    mockUpasListar.mockResolvedValue([UPA_COM_COORDENADAS]);

    render(<CitizenPortal onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    const munSelect = screen.getByDisplayValue('Selecione o município');
    await userEvent.selectOptions(munSelect, '1');
    const espSelect = screen.getByDisplayValue('Qual atendimento você busca?');
    await userEvent.selectOptions(espSelect, '2');
    await userEvent.click(screen.getByText('BUSCAR ATENDIMENTO'));

    await waitFor(() => {
      expect(screen.getByText('UPA Brotas')).toBeInTheDocument();
    });

    const callCountAfterSearch = mockUpasListar.mock.calls.length;

    // Advance 10 seconds — polling should fire once more
    await act(async () => {
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(10000);
    });
    vi.useRealTimers();

    expect(mockUpasListar.mock.calls.length).toBeGreaterThan(callCountAfterSearch);
  });

  it('Test 3: clearInterval ao desmontar componente com results ativo', async () => {
    mockUpasListar.mockResolvedValue([UPA_COM_COORDENADAS]);

    const { unmount } = render(<CitizenPortal onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    const munSelect = screen.getByDisplayValue('Selecione o município');
    await userEvent.selectOptions(munSelect, '1');
    const espSelect = screen.getByDisplayValue('Qual atendimento você busca?');
    await userEvent.selectOptions(espSelect, '2');
    await userEvent.click(screen.getByText('BUSCAR ATENDIMENTO'));

    await waitFor(() => {
      expect(screen.getByText('UPA Brotas')).toBeInTheDocument();
    });

    const callCount = mockUpasListar.mock.calls.length;

    vi.useFakeTimers();
    unmount();

    // After unmount, advancing timers should NOT trigger more calls
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    vi.useRealTimers();

    // No additional calls after unmount (clearInterval worked)
    expect(mockUpasListar.mock.calls.length).toBe(callCount);
  });

  it('Test 4: refetch não chama setIsSearching — sem spinner durante polling', async () => {
    mockUpasListar.mockResolvedValue([UPA_COM_COORDENADAS]);

    render(<CitizenPortal onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    const munSelect = screen.getByDisplayValue('Selecione o município');
    await userEvent.selectOptions(munSelect, '1');
    const espSelect = screen.getByDisplayValue('Qual atendimento você busca?');
    await userEvent.selectOptions(espSelect, '2');
    await userEvent.click(screen.getByText('BUSCAR ATENDIMENTO'));

    await waitFor(() => {
      expect(screen.getByText('UPA Brotas')).toBeInTheDocument();
    });

    // After search completes, button should show "BUSCAR ATENDIMENTO" (not spinner)
    expect(screen.getByText('BUSCAR ATENDIMENTO')).toBeInTheDocument();

    // Simulate polling tick
    await act(async () => {
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(10000);
    });
    vi.useRealTimers();

    // Button still shows text — isSearching was NOT set during polling
    await waitFor(() => {
      expect(screen.getByText('BUSCAR ATENDIMENTO')).toBeInTheDocument();
    });
  });
});

describe('CitizenPortal — Botão Google Maps', () => {
  beforeEach(() => {
    mockUpasListar.mockReset();
    mockMunicipiosListar.mockResolvedValue([{ id: 1, nome: 'Salvador', uf: 'BA' }]);
    mockEspecialidadesListar.mockResolvedValue([{ id: 2, nome: 'Clínica Geral' }]);
  });

  it('Test 5: UPA com lat/lng renderiza link com href correto para Google Maps', async () => {
    await renderAndSearch([UPA_COM_COORDENADAS]);

    await waitFor(() => {
      expect(screen.getByText('UPA Brotas')).toBeInTheDocument();
    });

    const mapLink = screen.getByRole('link', { name: /ver upa brotas no google maps/i });
    expect(mapLink).toHaveAttribute(
      'href',
      `https://www.google.com/maps?q=${UPA_COM_COORDENADAS.latitude},${UPA_COM_COORDENADAS.longitude}`
    );
  });

  it('Test 6: link do mapa tem target="_blank" e rel="noopener noreferrer"', async () => {
    await renderAndSearch([UPA_COM_COORDENADAS]);

    await waitFor(() => {
      expect(screen.getByText('UPA Brotas')).toBeInTheDocument();
    });

    const mapLink = screen.getByRole('link', { name: /ver upa brotas no google maps/i });
    expect(mapLink).toHaveAttribute('target', '_blank');
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('Test 7: UPA com latitude=null e longitude=null não renderiza botão de mapa', async () => {
    await renderAndSearch([UPA_SEM_COORDENADAS]);

    await waitFor(() => {
      expect(screen.getByText('UPA Nordeste')).toBeInTheDocument();
    });

    const mapLinks = screen.queryAllByRole('link', { name: /google maps/i });
    expect(mapLinks).toHaveLength(0);
  });
});
