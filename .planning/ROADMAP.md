# Roadmap: MedBusca

## Overview

Completar o 20% restante do sistema MedBusca para entrega do TCC em Junho 2026. O sistema já possui autenticação, CRUD completo, gestão de turnos e portal do cidadão. Este milestone implementa recuperação de senha, alertas automáticos, polling em tempo real e relatórios conectados à API real.

## Phases

- [x] **Phase 1: Recuperação de Senha** - Fluxo completo de "esqueci minha senha" no backend e frontend (completed 2026-04-12)
- [ ] **Phase 2: Alertas Automáticos** - Django signals e commands para gerar alertas sem intervenção manual
- [ ] **Phase 3: Polling em Tempo Real** - Atualização automática do portal do cidadão e dashboards
- [ ] **Phase 4: Relatórios e Refinamentos** - Relatórios conectados à API real e ajustes finais

## Phase Details

### Phase 1: Recuperação de Senha
**Goal**: Usuários conseguem redefinir senha sem intervenção de admin.
**Depends on**: Nothing (first phase)
**Requirements**: R1
**Success Criteria** (what must be TRUE):
  1. Usuário solicita redefinição via email e recebe o link
  2. Link abre tela de nova senha e permite salvar
  3. Login funciona normalmente após redefinição
  4. Token expirado ou já usado retorna erro claro
**Plans**: 2 plans

Plans:
- [x] 01-01: Backend — endpoints esqueci-senha e redefinir-senha com token de 1h
- [x] 01-02: Frontend — tela de solicitação, tela de nova senha e link na LoginPage

### Phase 2: Alertas Automáticos
**Goal**: Sistema gera alertas críticos automaticamente quando situações de risco ocorrem nas UPAs.
**Depends on**: Phase 1
**Requirements**: R2
**Success Criteria** (what must be TRUE):
  1. Encerrar turno do único médico de uma especialidade gera alerta crítico para gestor de UPA
  2. Iniciar turno resolve automaticamente o alerta de cobertura
  3. Turno previsto não iniciado gera alerta após horário de início
  4. UPA sem gestor gera alerta para gestor municipal
**Plans**: 3 plans

Plans:
- [ ] 02-01: Django signals — alerta ao encerrar turno sem cobertura e auto-resolução ao iniciar turno
- [ ] 02-02: Management command verificar_turnos_nao_iniciados para alertas de não comparecimento
- [ ] 02-03: Alertas municipais e globais — UPA sem gestor, município sem gestor

### Phase 3: Polling em Tempo Real
**Goal**: Portal do cidadão e dashboards refletem mudanças de status automaticamente sem reload.
**Depends on**: Phase 2
**Requirements**: R3
**Success Criteria** (what must be TRUE):
  1. Portal do cidadão atualiza status das UPAs a cada 10 segundos automaticamente
  2. Dashboard do médico atualiza status do turno a cada 15 segundos
  3. Dashboard gestor de UPA atualiza lista de médicos a cada 15 segundos
  4. Indicador de "última atualização" visível nos dashboards
**Plans**: 2 plans

Plans:
- [ ] 03-01: Portal do cidadão — polling 10s com indicador de última atualização
- [ ] 03-02: Dashboard médico e gestor de UPA — polling 15s com indicador visual

### Phase 4: Relatórios e Refinamentos
**Goal**: Relatórios exibem dados reais da API e sistema está pronto para entrega do TCC.
**Depends on**: Phase 3
**Requirements**: R4
**Success Criteria** (what must be TRUE):
  1. ReportsDashboard exibe dados reais com filtro por mês funcionando
  2. Gestor municipal visualiza relatório consolidado do município
  3. Todos os 5 perfis completam seus fluxos principais sem erro
**Plans**: 2 plans

Plans:
- [ ] 04-01: Frontend — conectar ReportsDashboard e relatório municipal à API real
- [ ] 04-02: Refinamentos — revisão geral, correção de bugs, testes dos fluxos principais

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Recuperação de Senha | 2/2 | Complete   | 2026-04-12 |
| 2. Alertas Automáticos | 0/3 | Not started | - |
| 3. Polling em Tempo Real | 0/2 | Not started | - |
| 4. Relatórios e Refinamentos | 0/2 | Not started | - |
