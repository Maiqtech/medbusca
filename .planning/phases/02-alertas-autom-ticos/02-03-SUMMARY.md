---
phase: 02-alertas-autom-ticos
plan: "03"
subsystem: api
tags: [django, management-command, alerts, gestor, structural-checks]

requires:
  - phase: 02-alertas-autom-ticos/02-01
    provides: Alerta model with upa/municipio scoping and AlertaList view
  - phase: 02-alertas-autom-ticos/02-02
    provides: Management command pattern for periodic alert checks

provides:
  - Management command verificar_alertas_estruturais that creates/resolves structural gap alerts
  - Inline hooks in views.py that re-evaluate alerts on user create/deactivate
  - Auto-resolve: gestor creation resolves open UPA/Municipio alerts
  - Auto-create: gestor deactivation triggers structural re-check

affects: [03-polling-tempo-real, any future phase using gestor lifecycle events]

tech-stack:
  added: [pytest, pytest-django, backend/settings_test.py (SQLite test config)]
  patterns:
    - get_or_create on (tipo, mensagem, upa, municipio, resolvido=False) prevents duplicate alerts
    - Helper functions exported from management command and imported into views.py (single source of truth)
    - settings_test.py overrides DB to SQLite for local test runs

key-files:
  created:
    - api/management/commands/verificar_alertas_estruturais.py
    - api/tests/test_alertas_estruturais.py
    - api/tests/__init__.py
    - backend/settings_test.py
    - pytest.ini
  modified:
    - api/views.py

key-decisions:
  - "Store municipio FK on Municipio-sem-gestor alert so it can be resolved per-municipio later; super_admin sees it because AlertaList has no filter for super_admin"
  - "Export helper functions from management command module and import into views.py to keep logic in one place"
  - "SQLite test settings (settings_test.py) added to allow local pytest runs without Postgres credentials"

patterns-established:
  - "Structural alert check: get_or_create by (tipo, mensagem, upa, municipio, resolvido=False) — call verificar_alertas_* after any user lifecycle event affecting gestores"

requirements-completed: [R2]

duration: 20min
completed: 2026-04-12
---

# Phase 2 Plan 03: Alertas Estruturais Summary

**Django management command + views.py hooks that auto-create aviso/informativo alerts when UPAs or Municipios lack active gestores, and auto-resolve them when the gap is corrected**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-12T02:30:00Z
- **Completed:** 2026-04-12T02:50:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Management command `verificar_alertas_estruturais` scans all active UPAs and Municipios, creates aviso/informativo alerts for structural gaps, resolves them when corrected
- Dedup guard via `get_or_create` on `(tipo, mensagem, upa, municipio, resolvido=False)` prevents alert accumulation
- Inline hooks in `UsuarioListCreate.create` and `desativar_usuario` trigger re-evaluation on gestor lifecycle events
- 5/5 pytest tests pass covering create, no-duplicate, resolve for both UPA and Municipio scenarios
- SQLite test settings added so tests run locally without Postgres credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Management command verificar_alertas_estruturais + tests** - `1b41ba7` (feat)
2. **chore: restore files accidentally deleted by soft-reset** - `fdd24b5` (chore)
3. **Task 2: Hook verificar_alertas into views.py** - `ffabd5a` (feat)

## Files Created/Modified
- `api/management/commands/verificar_alertas_estruturais.py` - Management command + exported helper functions
- `api/tests/test_alertas_estruturais.py` - 5 pytest tests for structural alert logic
- `api/tests/__init__.py` - Package init for tests directory
- `backend/settings_test.py` - SQLite settings for local pytest runs
- `pytest.ini` - Pytest config pointing to settings_test
- `api/views.py` - Added import + hooks in create and desativar_usuario

## Decisions Made
- Storing municipio FK on "Município sem gestor municipal" alerts (not upa=None, municipio=None) so `_resolver_alertas` can target the correct municipio when resolving. Super admin sees all alerts regardless.
- Helper functions live in the management command module and are imported into views.py — avoids duplication and keeps logic in one place.
- Added `settings_test.py` with SQLite DB since production settings require Postgres env vars that are not available locally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pytest + pytest-django and settings_test.py for local test runs**
- **Found during:** Task 1 (TDD setup)
- **Issue:** Production settings require Postgres env vars (DB_PASSWORD, DB_HOST) unavailable locally; pytest-django not installed
- **Fix:** Installed pytest/pytest-django, created backend/settings_test.py with SQLite, added pytest.ini pointing to it
- **Files modified:** backend/settings_test.py, pytest.ini
- **Verification:** `python -m pytest api/tests/test_alertas_estruturais.py` passes 5/5
- **Committed in:** 1b41ba7

**2. [Rule 3 - Blocking] Restored files accidentally deleted by soft-reset**
- **Found during:** Between Task 1 commit and Task 2
- **Issue:** `git reset --soft` to rebase onto target base left planning files, previous management commands, migrations, and frontend components staged for deletion; they were included in the Task 1 commit
- **Fix:** Checked out deleted files from base commit (a37b977) and committed restoration
- **Files modified:** .planning/**, api/management/commands/verificar_turnos_nao_iniciados.py, api/migrations/0004_tokens_redefinicao_senha.py, src/components/EsqueciSenha.tsx, src/components/RedefinirSenha.tsx
- **Verification:** git status shows all planning files and source files present
- **Committed in:** fdd24b5

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for test execution and repo integrity. No scope creep.

## Issues Encountered
- Worktree soft-reset to match base commit left previously-staged deletions that were committed accidentally. Restored all deleted files in a follow-up commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (Alertas Automáticos) fully complete: inline turno alerts (02-01), cron/command for turno-nao-iniciado (02-02), structural gap alerts (02-03)
- Phase 3 (Polling em Tempo Real) can proceed; alert data is now being populated automatically

---
*Phase: 02-alertas-autom-ticos*
*Completed: 2026-04-12*
