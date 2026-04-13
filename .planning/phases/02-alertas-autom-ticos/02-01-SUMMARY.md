---
phase: 02-alertas-autom-ticos
plan: "01"
subsystem: backend
tags: [alerts, shifts, coverage, django, views]
requirements: [ALERTA-01, ALERTA-02]

dependency_graph:
  requires: []
  provides: [alert-lifecycle-create, alert-lifecycle-resolve]
  affects: [api/views.py]

tech_stack:
  added: []
  patterns:
    - "Inline ORM alert logic inside view functions (no separate service layer)"
    - "Dedup guard via Alerta.objects.filter().exists() before create"
    - "Bulk resolve via .update(resolvido=True, resolvido_em=timezone.now())"

key_files:
  created: []
  modified:
    - api/views.py

decisions:
  - "Alert logic placed inline in views rather than a signal or service to keep TCC scope minimal and testable"
  - "mensagem__icontains filter used for dedup/resolve — matches specialty name embedded in alert message"
  - "exclude(medico=medico) in coverage check is redundant (shift already saved as encerrado) but kept for intent clarity"

metrics:
  duration_minutes: 15
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_changed: 1
---

# Phase 2 Plan 01: Inline Alert Logic for Shift Events Summary

Wired critical coverage-gap alert lifecycle into `encerrar_turno` and `iniciar_turno` view functions — creating a `critico` Alerta when the last doctor of a specialty ends their shift, and auto-resolving it when any doctor of that specialty starts a new shift.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add coverage-gap alert to encerrar_turno | 29411c3 | api/views.py |
| 2 | Add auto-resolve logic to iniciar_turno | 26755f3 | api/views.py |

## What Was Built

**encerrar_turno** now includes, after saving the shift as `encerrado`:
1. Coverage check — queries for any other active doctor of the same specialty at the same UPA
2. Dedup check — skips alert creation if an unresolved `critico` alert for that specialty already exists
3. Alert create — `Alerta.objects.create(tipo='critico', mensagem=..., upa=upa, municipio=upa.municipio)` only when both checks pass

**iniciar_turno** now includes, after creating the `RegistroTurno`:
- Bulk resolve — `Alerta.objects.filter(upa=upa, tipo='critico', resolvido=False, mensagem__icontains=especialidade.nome).update(resolvido=True, resolvido_em=timezone.now())`

Both views return the same HTTP status codes and response shapes as before (no API contract change).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — alert creation and resolution are fully wired to real model data. No placeholder values.

## Threat Flags

None — all new logic is behind existing `IsMedico` permission. Alert scope (upa/municipio FK) enforced at creation; read-time filtering already handled by `AlertaList` view (out of scope for this plan).

## Self-Check: PASSED

- api/views.py: FOUND
- .planning/phases/02-alertas-autom-ticos/02-01-SUMMARY.md: FOUND
- Commit 29411c3 (Task 1): FOUND
- Commit 26755f3 (Task 2): FOUND
- tem_cobertura in views.py: 2 occurrences
- resolvido=True in views.py: 1 occurrence
