import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = [
  {
    id: 'u1',
    nome: 'Antônio Maia',
    email: 'superadmin@teste.com',
    senha_hash: bcrypt.hashSync('123456', 10),
    perfil: 'super_admin',
    ativo: true,
    municipio_id: null,
    upa_id: null,
    criado_em: new Date().toISOString(),
  },
  {
    id: 'u2',
    nome: 'Ricardo Oliveira',
    email: 'gestor@teste.com',
    senha_hash: bcrypt.hashSync('123456', 10),
    perfil: 'gestor_municipal',
    ativo: true,
    municipio_id: 'm1',
    upa_id: null,
    criado_em: new Date().toISOString(),
  },
  {
    id: 'u3',
    nome: 'Carlos Oliveira',
    email: 'upa@teste.com',
    senha_hash: bcrypt.hashSync('123456', 10),
    perfil: 'gestor_upa',
    ativo: true,
    municipio_id: 'm1',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'u4',
    nome: 'Dr. João Silva',
    email: 'medico@teste.com',
    senha_hash: bcrypt.hashSync('123456', 10),
    perfil: 'medico',
    ativo: true,
    municipio_id: 'm1',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
];

// ─── Municipalities ───────────────────────────────────────────────────────────
export const municipios = [
  { id: 'm1', nome: 'Salvador', uf: 'BA', logo_url: '', ativo: true, criado_em: new Date().toISOString() },
  { id: 'm2', nome: 'Feira de Santana', uf: 'BA', logo_url: '', ativo: true, criado_em: new Date().toISOString() },
  { id: 'm3', nome: 'Vitória da Conquista', uf: 'BA', logo_url: '', ativo: true, criado_em: new Date().toISOString() },
];

// ─── Specialties ──────────────────────────────────────────────────────────────
export const especialidades = [
  { id: 'e1', nome: 'Clínica Geral' },
  { id: 'e2', nome: 'Ortopedia' },
  { id: 'e3', nome: 'Pediatria' },
  { id: 'e4', nome: 'Ginecologia' },
  { id: 'e5', nome: 'Cardiologia' },
];

// ─── UPAs ─────────────────────────────────────────────────────────────────────
export const upas = [
  {
    id: 'upa1',
    nome: 'UPA 24h Hélio Machado',
    endereco: 'Av. Helio Machado, 100',
    bairro: 'Itapuã',
    municipio_id: 'm1',
    gestor_id: 'u3',
    ativa: true,
    especialidades: ['e1', 'e2', 'e3'],
    criado_em: new Date().toISOString(),
  },
  {
    id: 'upa2',
    nome: 'UPA 24h San Martin',
    endereco: 'Rua San Martin, 200',
    bairro: 'San Martin',
    municipio_id: 'm1',
    gestor_id: null,
    ativa: true,
    especialidades: ['e1', 'e3'],
    criado_em: new Date().toISOString(),
  },
  {
    id: 'upa3',
    nome: 'UPA 24h Valéria',
    endereco: 'Av. Valéria, 300',
    bairro: 'Valéria',
    municipio_id: 'm1',
    gestor_id: null,
    ativa: false,
    especialidades: ['e1', 'e4'],
    criado_em: new Date().toISOString(),
  },
  {
    id: 'upa4',
    nome: 'UPA 24h Cajazeiras',
    endereco: 'Av. Cajazeiras, 400',
    bairro: 'Cajazeiras',
    municipio_id: 'm1',
    gestor_id: null,
    ativa: true,
    especialidades: ['e1', 'e3'],
    criado_em: new Date().toISOString(),
  },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const medicos = [
  {
    id: 'med1',
    usuario_id: 'u4',
    nome: 'Dr. João Silva',
    crm: '12345-BA',
    especialidade_id: 'e2',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'med2',
    usuario_id: null,
    nome: 'Dra. Maria Souza',
    crm: '23456-BA',
    especialidade_id: 'e3',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'med3',
    usuario_id: null,
    nome: 'Dr. Carlos Lima',
    crm: '34567-BA',
    especialidade_id: 'e1',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'med4',
    usuario_id: null,
    nome: 'Dra. Ana Paula',
    crm: '45678-BA',
    especialidade_id: 'e4',
    upa_id: 'upa1',
    criado_em: new Date().toISOString(),
  },
];

// ─── Schedules ────────────────────────────────────────────────────────────────
export const escalas = [
  {
    id: 'esc1',
    medico_id: 'med1',
    upa_id: 'upa1',
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '07:00',
    hora_fim: '13:00',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'esc2',
    medico_id: 'med2',
    upa_id: 'upa1',
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '07:00',
    hora_fim: '13:00',
    criado_em: new Date().toISOString(),
  },
  {
    id: 'esc3',
    medico_id: 'med3',
    upa_id: 'upa1',
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '13:00',
    hora_fim: '19:00',
    criado_em: new Date().toISOString(),
  },
];

// ─── Shifts (Turnos) ──────────────────────────────────────────────────────────
export const turnos = [
  {
    id: 'tur1',
    medico_id: 'med1',
    escala_id: 'esc1',
    status: 'em_atendimento',
    iniciado_em: new Date().toISOString(),
    encerrado_em: null,
  },
  {
    id: 'tur2',
    medico_id: 'med2',
    escala_id: 'esc2',
    status: 'em_pausa',
    iniciado_em: new Date().toISOString(),
    encerrado_em: null,
  },
];

// ─── Shift History ────────────────────────────────────────────────────────────
export const registrosTurno = [];

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertas = [
  {
    id: 'al1',
    tipo: 'critico',
    mensagem: 'UPA Valéria inativa sem justificativa',
    upa_id: 'upa3',
    municipio_id: 'm1',
    resolvido: false,
    criado_em: new Date().toISOString(),
  },
  {
    id: 'al2',
    tipo: 'aviso',
    mensagem: 'UPA San Martin sem gestor responsável',
    upa_id: 'upa2',
    municipio_id: 'm1',
    resolvido: false,
    criado_em: new Date().toISOString(),
  },
  {
    id: 'al3',
    tipo: 'aviso',
    mensagem: 'Especialidade Cardiologia sem médico ativo na UPA Hélio Machado',
    upa_id: 'upa1',
    municipio_id: 'm1',
    resolvido: false,
    criado_em: new Date().toISOString(),
  },
];

// ─── Revoked tokens (JWT blacklist) ──────────────────────────────────────────
export const tokenBlacklist = new Set();

// ─── Helper: add entity ───────────────────────────────────────────────────────
export function addEntity(arr, data) {
  const entity = { id: uuidv4(), criado_em: new Date().toISOString(), ...data };
  arr.push(entity);
  return entity;
}
