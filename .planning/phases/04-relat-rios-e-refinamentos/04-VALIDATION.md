---
phase: 4
slug: relat-rios-e-refinamentos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react |
| **Config file** | `vite.config.ts` (seção `test`) |
| **Quick run command** | `npm test -- --run ReportsDashboard` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run ReportsDashboard`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | R4-reports | relatoriosApi.upa() chamado com upa_id autenticado | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | R4-month | Mudança de mês re-chama API com mes=YYYY-MM | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 | ⬜ pending |
| 04-01-03 | 01 | 1 | R4-loading | isLoading inicial; dados visíveis após fetch | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 2 | R4-5perfis | Todos os 5 fluxos sem erro no console | manual | — | manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/ReportsDashboard.test.tsx` — cobre R4-reports, R4-month, R4-loading
  - Mock: `relatoriosApi` + `useApp` (mesmo padrão de `UPAManagerDashboard.test.tsx`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 5 perfis completam fluxos sem erro | R4 critério 3 | Requer interação humana com cada perfil | Seguir checklist em 04-UAT.md; DevTools console aberto |
