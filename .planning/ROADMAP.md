# Roadmap — MedBusca Milestone 1 (Fase Final TCC)

## Objetivo
Completar o 20% restante do sistema para entrega do TCC em Junho 2026.

---

## Fase 1 — Recuperação de Senha
**Goal:** Usuários conseguem redefinir senha sem intervenção de admin.

### Planos
- **1.1** Backend: endpoints `esqueci-senha` e `redefinir-senha` com token de 1 hora
- **1.2** Frontend: tela de solicitação + tela de nova senha + link na LoginPage

**Verificação:** Usuário consegue solicitar, receber email, clicar no link e definir nova senha. Login funciona após redefinição.

---

## Fase 2 — Alertas Automáticos
**Goal:** Sistema gera alertas sem intervenção manual quando situações críticas ocorrem.

### Planos
- **2.1** Backend signals: alerta ao encerrar turno sem cobertura + auto-resolução ao iniciar turno
- **2.2** Backend command: `verificar_turnos_nao_iniciados` (verificação horária)
- **2.3** Backend: alertas municipais (UPA sem gestor) e globais (município sem gestor)

**Verificação:** Encerrar turno do único médico de uma especialidade gera alerta crítico no dashboard do gestor. Iniciar turno resolve o alerta.

---

## Fase 3 — Polling em Tempo Real
**Goal:** Portal do cidadão e dashboards refletem mudanças de status sem recarregar a página.

### Planos
- **3.1** Portal do cidadão: polling 10s + indicador "atualizado há X segundos"
- **3.2** Dashboard médico + gestor de UPA: polling 15s + badge de última atualização

**Verificação:** Médico faz check-in e em até 15 segundos o portal do cidadão mostra "Disponível agora" sem reload manual.

---

## Fase 4 — Relatórios e Refinamentos
**Goal:** Relatórios exibem dados reais da API. Sistema pronto para entrega.

### Planos
- **4.1** Frontend: conectar `ReportsDashboard` ao endpoint real de relatórios de UPA
- **4.2** Frontend: relatório municipal no dashboard do gestor municipal
- **4.3** Refinamentos: revisar alertas no frontend, testar fluxo completo, corrigir bugs encontrados

**Verificação:** Relatório de UPA exibe dados reais com filtro por mês funcionando. Todos os 5 perfis conseguem completar seus fluxos principais sem erro.

---

## Sequência recomendada
```
Fase 1 → Fase 2 → Fase 3 → Fase 4
```
Fases 2 e 3 podem ser trabalhadas em paralelo após Fase 1.
