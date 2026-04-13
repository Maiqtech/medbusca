# MedBusca

## O que é
Plataforma SaaS de transparência das escalas médicas nas UPAs de Salvador. Cidadãos buscam especialistas disponíveis em tempo real sem login. Médicos fazem check-in digital. Gestores monitoram cobertura e recebem alertas.

## Stack
- **Backend:** Django 6 + DRF + Simple JWT + django-cors-headers
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + VitePWA
- **Banco:** PostgreSQL via Supabase (connection pooler)
- **Deploy:** Render (backend) + Netlify (frontend)

## Perfis de usuário
1. **Cidadão** — acesso público, sem login
2. **Médico** — check-in/pausa/encerramento de turno
3. **Gestor de UPA** — gerencia médicos, escalas, monitora turnos
4. **Gestor Municipal** — gerencia UPAs e gestores, relatórios
5. **Super Admin** — gerencia municípios e gestores municipais

## Estado atual (~80% completo)
- Autenticação JWT com blacklist ✓
- Ativação de conta via email ✓
- CRUD completo: municípios, UPAs, médicos, especialidades, escalas ✓
- Gestão de turnos (iniciar/pausar/retornar/encerrar) ✓
- Portal do cidadão com busca de especialidades ✓
- Previsão baseada em escala cadastrada ✓
- Dashboards para todos os perfis ✓
- Alertas — model existe, mas sem geração automática ✗
- Recuperação de senha — apenas ativação inicial, sem "esqueci senha" ✗
- Polling tempo real — sem atualização automática no frontend ✗
- Relatórios — frontend com dados mockados ✗

## Arquivos-chave
- Backend settings: `backend/settings.py`
- Models: `api/models.py`
- Views: `api/views.py`
- Serializers: `api/serializers.py`
- URLs: `api/urls.py`
- Seed: `api/management/commands/seed.py`
- Email service: `api/email_service.py`
- Frontend API client: `src/services/api.ts`
- App context: `src/store/AppContext.tsx`

## Credenciais de produção
- Superadmin: admin@medbusca.gov.br / MedBusca@2026
- Backend: https://medbusca-backend.onrender.com
- Frontend: https://medbuscaa.netlify.app

## Contexto TCC
Trabalho de Conclusão de Curso — UCSAL (Análise e Desenvolvimento de Sistemas). Entrega: Junho 2026. Equipe de 5. Orientador: Luan Rafael Santana Galvão.
