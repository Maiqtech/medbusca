import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingPage from '../components/LandingPage';

const mockMunicipalities = [
  { id: 'salvador', name: 'Salvador', uf: 'BA', systemName: 'MedBusca Salvador', logo: '' },
];

describe('LandingPage', () => {
  it('renderiza as duas opções de perfil', () => {
    render(
      <LandingPage
        onSelectRole={vi.fn()}
        municipalities={mockMunicipalities}
      />
    );
    expect(screen.getByText('Sou Cidadão')).toBeInTheDocument();
    expect(screen.getByText('Sou Profissional')).toBeInTheDocument();
  });

  it('exibe nome do sistema no header', () => {
    render(
      <LandingPage
        onSelectRole={vi.fn()}
        systemName="MedBusca"
        municipalities={mockMunicipalities}
      />
    );
    expect(screen.getByText('MedBusca')).toBeInTheDocument();
  });

  it('ao clicar em Profissional chama onSelectRole com "professional"', () => {
    const onSelectRole = vi.fn();
    render(
      <LandingPage
        onSelectRole={onSelectRole}
        municipalities={mockMunicipalities}
      />
    );
    fireEvent.click(screen.getByText('Sou Profissional'));
    expect(onSelectRole).toHaveBeenCalledWith('professional');
  });

  it('ao clicar em Cidadão exibe seleção de município', async () => {
    render(
      <LandingPage
        onSelectRole={vi.fn()}
        municipalities={mockMunicipalities}
      />
    );
    fireEvent.click(screen.getByText('Sou Cidadão'));
    await waitFor(() => {
      expect(screen.getByText('Onde você está?')).toBeInTheDocument();
    });
  });
});
