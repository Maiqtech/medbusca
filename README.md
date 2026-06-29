# MedBusca

Plataforma pública de saúde para busca de atendimento em UPAs (Unidades de Pronto Atendimento) de municípios brasileiros. Sistema que conecta cidadãos com especialidades médicas disponíveis em tempo real.

**Projeto:** TCC — UCSAL  
**Desenvolvedor:** Antônio Maia

---

## 🏗️ Arquitetura

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Django 6 + Django REST Framework
- **Autenticação:** Simple JWT
- **Banco de dados:** PostgreSQL (produção) / SQLite (desenvolvimento)
- **Hospedagem:** Supabase (produção)

---

## 🚀 Setup Local

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- Git

### Backend (Django)

```bash
# Criar virtualenv
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Rodas migrations
python manage.py migrate

# Criar dados iniciais
python manage.py seed
python manage.py seed_upas
python manage.py seed_medicos

# Rodar servidor
python manage.py runserver
```

**URL:** http://localhost:8000

### Frontend (React)

```bash
cd /path/to/medbusca

# Instalar dependências
npm install

# Rodar dev server
npm run dev
```

**URL:** http://localhost:5173

---

## 📋 Scripts Disponíveis

### Backend
- `python manage.py seed` — Cria especialidades e super admin
- `python manage.py seed_upas` — Cria UPAs com coordenadas
- `python manage.py seed_medicos` — Cria médicos nas UPAs
- `python manage.py runserver` — Inicia servidor de desenvolvimento

### Frontend
- `npm run dev` — Inicia Vite dev server
- `npm run build` — Build para produção
- `npm run preview` — Preview do build

---

## 🔐 Credenciais Padrão (Dev)

**Super Admin:**
- Email: `admin@medbusca.gov.br`
- Senha: `MedBusca@2026`

---

## 📁 Estrutura do Projeto

```
medbusca/
├── api/                    # Backend Django
│   ├── apps/              # Apps Django (auth, usuarios, municipios, upas, etc)
│   ├── models/            # Modelos (users, medical, location, scheduling)
│   ├── serializers/       # DRF serializers
│   ├── management/        # Commands (seed_upas, seed_medicos)
│   └── migrations/        # Database migrations
├── src/                   # Frontend React
│   ├── features/          # Feature-sliced components
│   ├── shared/            # Shared components & services
│   ├── App.tsx            # Main app component
│   └── index.css          # Tailwind imports
├── manage.py              # Django CLI
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
└── README.md             # Este arquivo
```

---

## 🎯 Funcionalidades Principais

- **Portal Público (Cidadão):**
  - Buscar UPAs por município
  - Filtrar por especialidade
  - Ver disponibilidade em tempo real
  - Localizar no Google Maps

- **Painel de Gestores:**
  - Gestores municipais: gerenciar gestores de UPA
  - Gestores de UPA: registrar médicos e escalas
  - Médicos: controlar presença e turnos

- **Painel Admin:**
  - Gerenciar municípios e UPAs
  - Criar usuários
  - Visualizar relatórios

---

## 🔗 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/municipios/` | Listar municípios |
| GET | `/api/upas/?municipio_id=1` | Listar UPAs por município |
| GET | `/api/especialidades/` | Listar especialidades |
| POST | `/api/auth/login/` | Autenticação |
| GET | `/api/usuarios/?perfil=medico` | Listar usuários por perfil |

---

## 🧪 Testes

```bash
# Backend
python manage.py test

# Frontend
npm run test
```

---

## 📝 Notas para Desenvolvimento

- **Migrations:** Rode após editar models: `python manage.py makemigrations && python manage.py migrate`
- **Seeds:** Se deletar dados, use os commands para recriar
- **CORS:** Configurado em `backend/settings.py` para `localhost:5173`
- **JWT:** Token válido por 24h, refresh por 7 dias

---

## 📄 Licença

Projeto acadêmico — UCSAL TCC 2026

---

**Dúvidas?** Consulte a documentação do Django (docs.djangoproject.com) e React (react.dev).
