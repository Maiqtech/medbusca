/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import MunicipalityRegistration from './components/MunicipalityRegistration';
import MunicipalityList from './components/MunicipalityList';
import MunicipalManagerDashboard from './components/MunicipalManagerDashboard';
import CitizenPortal from './components/CitizenPortal';
import DoctorDashboard from './components/DoctorDashboard';
import UPARegistration from './components/UPARegistration';
import UPAList from './components/UPAList';
import ManagerRegistration from './components/ManagerRegistration';
import ManagerList from './components/ManagerList';
import ReportsDashboard from './components/ReportsDashboard';
import UPAManagerDashboard from './components/UPAManagerDashboard';
import DoctorRegistration from './components/DoctorRegistration';
import DoctorList from './components/DoctorList';
import ScheduleRegistration from './components/ScheduleRegistration';
import ScheduleList from './components/ScheduleList';
import ShiftMonitoring from './components/ShiftMonitoring';
import PlaceholderPage from './components/PlaceholderPage';

type View = 'landing' | 'citizen' | 'login' | 'doctor' | 'manager' | 'admin' | 'register_municipality' | string;

const MOCK_MUNICIPALITIES = [
  { 
    id: 'salvador', 
    name: 'Salvador', 
    uf: 'BA', 
    systemName: 'MedBusca Salvador', 
    logo: 'https://salvador.ba.gov.br/wp-content/uploads/2021/04/logo-prefeitura-salvador.png' 
  },
  { 
    id: 'feira', 
    name: 'Feira de Santana', 
    uf: 'BA', 
    systemName: 'MedBusca Feira', 
    logo: 'https://www.feiradesantana.ba.gov.br/servicos/arquivos/logo_prefeitura_feira.png' 
  },
  { 
    id: 'vitoria', 
    name: 'Vitória da Conquista', 
    uf: 'BA', 
    systemName: 'MedBusca Conquista', 
    logo: 'https://www.pmvc.ba.gov.br/wp-content/uploads/logo-pmvc.png' 
  },
  {
    id: 'camacari',
    name: 'Camaçari',
    uf: 'BA',
    systemName: 'MedBusca Camaçari',
    logo: 'https://www.camacari.ba.gov.br/wp-content/uploads/2021/03/logo-prefeitura-camacari.png'
  },
  {
    id: 'itabuna',
    name: 'Itabuna',
    uf: 'BA',
    systemName: 'MedBusca Itabuna',
    logo: 'https://itabuna.ba.gov.br/wp-content/uploads/2021/01/logo-itabuna.png'
  },
  {
    id: 'aracaju',
    name: 'Aracaju',
    uf: 'SE',
    systemName: 'MedBusca Aracaju',
    logo: 'https://www.aracaju.se.gov.br/portal/images/logo_aracaju.png'
  },
  {
    id: 'maceio',
    name: 'Maceió',
    uf: 'AL',
    systemName: 'MedBusca Maceió',
    logo: 'https://maceio.al.gov.br/uploads/imagens/logo-maceio.png'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [systemConfig, setSystemConfig] = useState({
    name: 'MedBusca',
    logo: '',
    municipality: 'Salvador'
  });

  const handleSelectRole = (role: 'citizen' | 'professional', municipalityData?: any) => {
    if (role === 'professional') {
      setCurrentView('login');
    } else {
      if (municipalityData) {
        setSystemConfig({
          name: municipalityData.systemName,
          logo: municipalityData.logo,
          municipality: `${municipalityData.name}-${municipalityData.uf}`
        });
      }
      setCurrentView('citizen');
    }
  };

  const handleLoginSuccess = (role: string) => {
    // Simulate setting theme based on user's municipality
    if (role === 'manager' || role === 'upa_manager_dashboard' || role === 'doctor') {
      setSystemConfig({
        name: 'MedBusca Salvador',
        logo: 'https://salvador.ba.gov.br/wp-content/uploads/2021/04/logo-prefeitura-salvador.png',
        municipality: 'Salvador-BA'
      });
    } else {
      // Super Admin uses default theme
      setSystemConfig({
        name: 'MedBusca',
        logo: '',
        municipality: 'Salvador'
      });
    }
    setCurrentView(role as View);
  };

  const handleMunicipalityChange = (data: { name: string, uf: string }) => {
    const muni = MOCK_MUNICIPALITIES.find(m => m.name === data.name && m.uf === data.uf);
    if (muni) {
      setSystemConfig({
        name: muni.systemName,
        logo: muni.logo,
        municipality: `${muni.name}-${muni.uf}`
      });
    } else {
      // Fallback if not in mock list
      setSystemConfig(prev => ({
        ...prev,
        name: `MedBusca ${data.name}`,
        municipality: `${data.name}-${data.uf}`
      }));
    }
  };

  const handleBack = () => {
    setCurrentView('landing');
  };

  const handleNavigate = (screen: string) => {
    setCurrentView(screen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {currentView === 'landing' && (
        <LandingPage 
          onSelectRole={handleSelectRole} 
          systemName={systemConfig.name} 
          systemLogo={systemConfig.logo} 
          municipality={systemConfig.municipality} 
          municipalities={MOCK_MUNICIPALITIES}
        />
      )}
      
      {currentView === 'citizen' && (
        <CitizenPortal 
          onBack={handleBack} 
          onMunicipalityChange={handleMunicipalityChange}
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
          municipality={systemConfig.municipality}
        />
      )}
      
      {currentView === 'login' && (
        <LoginPage 
          onBack={handleBack} 
          onLoginSuccess={handleLoginSuccess} 
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
        />
      )}

      {currentView === 'admin' && (
        <SuperAdminDashboard 
          userName="Antônio Maia"
          onLogout={handleBack}
          onNavigate={handleNavigate}
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
        />
      )}

      {currentView === 'manager' && (
        <MunicipalManagerDashboard 
          userName="Ricardo Oliveira"
          cityName={systemConfig.municipality}
          onLogout={handleBack}
          onNavigate={handleNavigate}
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
        />
      )}

      {currentView === 'upa_manager_dashboard' && (
        <UPAManagerDashboard 
          userName="Carlos Oliveira"
          upaName="UPA 24h Hélio Machado"
          onLogout={handleBack}
          onNavigate={handleNavigate}
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
        />
      )}

      {currentView === 'register_municipality' && (
        <MunicipalityRegistration 
          onBack={() => setCurrentView('admin')}
          onSuccess={() => setCurrentView('admin')}
          userName="Antônio Maia"
          onLogout={handleBack}
        />
      )}

      {currentView === 'list_municipalities' && (
        <MunicipalityList 
          onBack={() => setCurrentView('admin')}
          onAdd={() => setCurrentView('register_municipality')}
          userName="Antônio Maia"
          onLogout={handleBack}
        />
      )}

      {currentView === 'register_upa' && (
        <UPARegistration 
          onBack={() => setCurrentView('manager')}
          onSuccess={() => setCurrentView('manager')}
          userName="Ricardo Oliveira"
          onLogout={handleBack}
        />
      )}

      {currentView === 'list_upa' && (
        <UPAList 
          onBack={() => setCurrentView('manager')}
          onAdd={() => setCurrentView('register_upa')}
          onSelect={(id) => setCurrentView('upa_manager_dashboard')}
          userName="Ricardo Oliveira"
          onLogout={handleBack}
        />
      )}

      {currentView === 'register_municipal_manager' && (
        <ManagerRegistration 
          title="Cadastrar Gestor Municipal"
          type="municipal"
          onBack={() => setCurrentView('admin')}
          onSuccess={() => setCurrentView('admin')}
          userName="Antônio Maia"
          onLogout={handleBack}
        />
      )}

      {currentView === 'register_upa_manager' && (
        <ManagerRegistration 
          title="Cadastrar Gestor de UPA"
          type="upa"
          onBack={() => setCurrentView('manager')}
          onSuccess={() => setCurrentView('manager')}
          userName="Ricardo Oliveira"
          onLogout={handleBack}
        />
      )}

      {currentView === 'list_manager' && (
        <ManagerList 
          onBack={() => setCurrentView('manager')}
          onAdd={() => setCurrentView('register_upa_manager')}
          userName="Ricardo Oliveira"
          onLogout={handleBack}
        />
      )}

      {currentView === 'reports' && (
        <ReportsDashboard 
          userName="Carlos Oliveira"
          onLogout={handleBack}
          onBack={() => setCurrentView('upa_manager_dashboard')}
        />
      )}

      {currentView === 'register_doctor' && (
        <DoctorRegistration 
          onBack={() => setCurrentView('upa_manager_dashboard')}
          onSuccess={() => setCurrentView('list_doctors')}
          userName="Carlos Oliveira"
          onLogout={handleBack}
          upaName="UPA 24h Hélio Machado"
        />
      )}

      {currentView === 'list_doctors' && (
        <DoctorList 
          onBack={() => setCurrentView('upa_manager_dashboard')}
          onAdd={() => setCurrentView('register_doctor')}
          onSelect={(id) => setCurrentView(`doctor_detail_${id}`)}
          userName="Carlos Oliveira"
          onLogout={handleBack}
          upaName="UPA 24h Hélio Machado"
        />
      )}

      {currentView === 'register_schedule' && (
        <ScheduleRegistration 
          onBack={() => setCurrentView('upa_manager_dashboard')}
          onSuccess={() => setCurrentView('list_schedules')}
          userName="Carlos Oliveira"
          onLogout={handleBack}
          upaName="UPA 24h Hélio Machado"
        />
      )}

      {currentView === 'list_schedules' && (
        <ScheduleList 
          onBack={() => setCurrentView('upa_manager_dashboard')}
          onAdd={() => setCurrentView('register_schedule')}
          userName="Carlos Oliveira"
          onLogout={handleBack}
          upaName="UPA 24h Hélio Machado"
        />
      )}

      {currentView === 'monitor_shifts' && (
        <ShiftMonitoring 
          onBack={() => setCurrentView('upa_manager_dashboard')}
          userName="Carlos Oliveira"
          onLogout={handleBack}
          upaName="UPA 24h Hélio Machado"
        />
      )}
      
      {currentView === 'doctor' && (
        <DoctorDashboard 
          userName="Antônio Maia"
          onLogout={handleBack}
          systemName={systemConfig.name}
          systemLogo={systemConfig.logo}
        />
      )}

      {/* Dynamic Placeholder for remaining sub-screens */}
      {typeof currentView === 'string' && !['landing', 'citizen', 'login', 'doctor', 'manager', 'admin', 'register_municipality', 'list_municipalities', 'register_upa', 'list_upa', 'register_municipal_manager', 'register_upa_manager', 'list_manager', 'reports', 'upa_manager_dashboard', 'register_doctor', 'list_doctors', 'register_schedule', 'list_schedules', 'monitor_shifts'].includes(currentView) && (
        <PlaceholderPage 
          title={`Tela: ${currentView.replace('_', ' ').toUpperCase()}`} 
          userName={
            currentView.startsWith('register_doctor') || currentView.startsWith('list_doctors') || currentView.startsWith('register_schedule') || currentView.startsWith('list_schedules') || currentView.startsWith('monitor_shifts') || currentView.startsWith('doctor_detail') ? "Carlos Oliveira" :
            currentView.startsWith('register_upa') || currentView.startsWith('list_upa') || currentView.startsWith('upa_detail') || currentView.startsWith('register_upa_manager') || currentView.startsWith('list_manager') ? "Ricardo Oliveira" :
            "Antônio Maia"
          }
          roleName={
            currentView.startsWith('register_doctor') || currentView.startsWith('list_doctors') || currentView.startsWith('register_schedule') || currentView.startsWith('list_schedules') || currentView.startsWith('monitor_shifts') || currentView.startsWith('doctor_detail') ? "Gestor de UPA" :
            currentView.startsWith('register_upa') || currentView.startsWith('list_upa') || currentView.startsWith('upa_detail') || currentView.startsWith('register_upa_manager') || currentView.startsWith('list_manager') ? "Gestor Municipal" :
            "Super Admin"
          }
          onLogout={handleBack}
          onBack={() => {
            if (currentView.startsWith('register_doctor') || currentView.startsWith('list_doctors') || currentView.startsWith('register_schedule') || currentView.startsWith('list_schedules') || currentView.startsWith('monitor_shifts') || currentView.startsWith('doctor_detail')) {
              setCurrentView('upa_manager_dashboard');
            } else if (currentView.startsWith('register_upa') || currentView.startsWith('list_upa') || currentView.startsWith('upa_detail') || currentView.startsWith('register_upa_manager') || currentView.startsWith('list_manager')) {
              setCurrentView('manager');
            } else {
              setCurrentView('admin');
            }
          }} 
        />
      )}
    </div>
  );
}
