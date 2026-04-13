---
phase: 03
slug: polling-em-tempo-real
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend) |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After wave complete:** Run full suite + manual smoke test in browser

---

## Coverage Requirements

| Requirement | Test Type | Description |
|-------------|-----------|-------------|
| Polling inicia após busca | Unit | CitizenPortal: setInterval chamado quando results !== null |
| Polling para no cleanup | Unit | clearInterval chamado no unmount / quando results vira null |
| Botão mapa aparece com coords | Unit | UPA com lat/lng renderiza ícone de mapa |
| Botão mapa oculto sem coords | Unit | UPA sem lat/lng não renderiza ícone |
| Link Google Maps correto | Unit | href contém lat e lng da UPA |
| Indicador de última atualização | Unit | Texto de timestamp visível após fetch |
| Polling DoctorDashboard | Unit | setInterval a 15s após mount |
| Polling UPAManagerDashboard | Unit | setInterval a 15s após mount |
