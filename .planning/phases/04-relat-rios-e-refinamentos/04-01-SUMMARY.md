---
phase: 04-relat-rios-e-refinamentos
plan: "01"
subsystem: frontend
tags: [reports, api-integration, tdd, month-filter]
dependency_graph:
  requires: []
  provides: [ReportsDashboard-api-connected]
  affects: [src/components/ReportsDashboard.tsx]
tech_stack:
  added: []
  patterns: [useCallback+useEffect fetch pattern, controlled month input]
key_files:
  created:
    - src/tests/ReportsDashboard.test.tsx
  modified:
    - src/components/ReportsDashboard.tsx
decisions:
  - "upa_id vem apenas de usuario?.upa_id sem fallback para municipio_id — gestor municipal usa MunicipalManagerDashboard próprio"
  - "Gráfico de barras permanece decorativo (research assumption A1 confirmado)"
  - "Botão Exportar mantido sem handler — fora de escopo R4"
metrics:
  duration: "~2 min"
  completed: "2026-04-13"
  tasks_completed: 2
  files_changed: 2
---

# Phase 04 Plan 01: ReportsDashboard API Integration Summary

**One-liner:** Conectou ReportsDashboard ao endpoint real `/api/relatorios/upa/<id>/` com filtro de mês `<input type="month">` e 3 testes unitários TDD.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Criar testes unitários (RED) | 0781a8e | src/tests/ReportsDashboard.test.tsx |
| 2 | Conectar ReportsDashboard ao relatoriosApi.upa (GREEN) | f349d6a | src/components/ReportsDashboard.tsx |

## What Was Built

**ReportsDashboard.tsx** refatorado:
- Removida constante `MOCK_DOCTOR_STATS` (4 médicos hardcoded)
- Adicionados `useState`, `useEffect`, `useCallback` para fetch dinâmico
- `relatoriosApi.upa(usuario.upa_id, mesSelecionado || undefined)` chamado no mount e ao mudar o filtro
- `<input type="month">` controlado por `mesSelecionado` — onChange re-executa fetch via dep do `useCallback`
- Cards exibem `dados?.medicos_ativos`, `dados?.total_horas`, `dados?.taxa_disponibilidade` (ou `'-'` se null)
- Tabela `Detalhamento por Profissional` itera `dados?.detalhamento` com campos em português (`nome`, `especialidade`, `total_horas`, `assiduidade`, `status`)
- Loading spinner (`Loader2 animate-spin`) visível até `.finally(() => setIsLoading(false))`
- Empty state na tabela quando `detalhamento` vazio
- Gráfico decorativo e botão "Exportar" mantidos sem alteração

**ReportsDashboard.test.tsx** criado (3 testes):
- Test 1: `relatoriosApi.upa` chamado com `(42, undefined)` no mount
- Test 2: após `fireEvent.change` no input type=month para `"2026-04"`, última chamada foi `(42, "2026-04")`
- Test 3: loading visível antes do resolve; após resolve, `"8"` e `"Dr. X"` na tela

## Test Results

- `ReportsDashboard.test.tsx`: **3/3 passam**
- Suíte completa: **8 arquivos, 37 testes, todos passam**

## Decisions Made

1. **`upa_id` sem fallback para `municipio_id`:** Gestor municipal acessa `MunicipalManagerDashboard` que já exibe dados do município. `ReportsDashboard` é exclusivo para gestor de UPA.
2. **Gráfico decorativo mantido:** Research assumption A1 confirmado — alturas `[60, 75, 80, ...]` são ilustrativas, sem dados reais.
3. **Exportar sem handler:** Fora do escopo de R4; botão mantido para não alterar layout.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Files created/modified
- `src/tests/ReportsDashboard.test.tsx` — FOUND
- `src/components/ReportsDashboard.tsx` — FOUND (modified)

### Commits exist
- `0781a8e` test(04-01): add failing tests for ReportsDashboard API integration — FOUND
- `f349d6a` feat(04-01): connect ReportsDashboard to real API with month filter — FOUND

## Self-Check: PASSED
