---
phase: 02-alertas-autom-ticos
plan: 02
subsystem: backend
tags: [management-command, alertas, escalas, idempotency]
dependency_graph:
  requires: [api/models.py (Escala, Turno, Alerta)]
  provides: [verificar_turnos_nao_iniciados management command]
  affects: [api/management/commands/]
tech_stack:
  added: []
  patterns: [Django management command, timezone-safe datetime range, idempotent write via filter().exists() before create()]
key_files:
  created:
    - api/management/commands/verificar_turnos_nao_iniciados.py
  modified: []
decisions:
  - Turno detection uses iniciado_em__gte/lt range (not __date=hoje) for timezone correctness with America/Bahia
  - Dedup key is (tipo='aviso', upa, mensagem, resolvido=False); mensagem encodes medico+time+upa making it specific per escala
  - Import timedelta at module level (moved out of loop per clean code)
metrics:
  duration: "38s"
  completed: "2026-04-13"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 2 Plan 02: verificar_turnos_nao_iniciados Command Summary

Management command that detects escalas whose hora_inicio has passed today with no matching Turno and creates a tipo='aviso' Alerta — idempotent via dedup check on (tipo, upa, mensagem, resolvido=False).

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Implement verificar_turnos_nao_iniciados command | b17cbc7 | api/management/commands/verificar_turnos_nao_iniciados.py |

## What Was Built

`api/management/commands/verificar_turnos_nao_iniciados.py` — a Django management command invoked via `python manage.py verificar_turnos_nao_iniciados`.

**Logic:**
1. Computes `hoje` and `hora_atual` via `timezone.localtime(timezone.now())` — timezone-safe for America/Bahia.
2. Queries `Escala.objects.filter(data=hoje, hora_inicio__lt=hora_atual)` with `select_related` on medico, upa, and upa__municipio.
3. For each escala: checks if medico has a Turno with `iniciado_em` in today's UTC-aware range (`hoje_inicio` to `hoje_fim`). If yes → skip (pulados++).
4. Builds a deterministic `mensagem` string encoding medico name, scheduled time, and UPA name.
5. Dedup check: `Alerta.objects.filter(tipo='aviso', upa=escala.upa, mensagem=mensagem, resolvido=False).exists()`. If exists → skip.
6. Creates `Alerta(tipo='aviso', mensagem=..., upa=..., municipio=escala.upa.municipio)`.
7. Reports `{criados} alerta(s) criado(s), {pulados} situacao(oes) ignorada(s).` to stdout.

## Verification

- `python manage.py verificar_turnos_nao_iniciados --help` — confirms command loads, help text matches.
- `python manage.py verificar_turnos_nao_iniciados` — runs cleanly against dev DB, outputs `[OK] Verificacao concluida: 0 alerta(s) criado(s), 0 situacao(oes) ignorada(s).`

## Deviations from Plan

None — plan executed exactly as written. Minor cleanup: moved `from datetime import timedelta` to module-level import (was inside the loop in the plan pseudocode).

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or external surface introduced. Threat mitigations from plan were implemented: T-02-02-01 (duplicate injection) mitigated via dedup check before create.

## Self-Check: PASSED

- File exists: `api/management/commands/verificar_turnos_nao_iniciados.py` — confirmed.
- Commit b17cbc7 exists — confirmed via `git log`.
