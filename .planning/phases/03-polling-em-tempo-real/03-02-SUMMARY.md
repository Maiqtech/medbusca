---
phase: 03-polling-em-tempo-real
plan: "02"
subsystem: frontend
tags: [polling, react, vitest, dashboard, doctor, upa-manager]
dependency_graph:
  requires: []
  provides:
    - DoctorDashboard polling 15s with last-updated indicator
    - UPAManagerDashboard polling 15s with last-updated indicator
  affects:
    - src/components/DoctorDashboard.tsx
    - src/components/UPAManagerDashboard.tsx
tech_stack:
  added: []
  patterns:
    - useCallback + setInterval for silent polling
    - Separate useEffects for polling vs clock (DoctorDashboard)
    - .finally() for one-time loading state (UPAManagerDashboard)
key_files:
  created:
    - src/tests/DoctorDashboard.test.tsx
    - src/tests/UPAManagerDashboard.test.tsx
  modified:
    - src/components/DoctorDashboard.tsx
    - src/components/UPAManagerDashboard.tsx
decisions:
  - Used act(async () => { await Promise.resolve() }) in tests instead of waitFor to flush microtasks under fake timers — waitFor times out with vi.useFakeTimers()
  - setIsLoading(false) called only in .finally() of the initial fetchDados() call so subsequent polling intervals never trigger the loading spinner
metrics:
  duration: ~10 minutes
  completed: 2026-04-13
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 3 Plan 02: Dashboard Polling 15s Summary

Silent 15s polling with "Atualizado às HH:MM" indicator added to DoctorDashboard and UPAManagerDashboard via useCallback + setInterval pattern.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Polling 15s + indicator — DoctorDashboard | f7138fa | DoctorDashboard.tsx, DoctorDashboard.test.tsx |
| 2 | Polling 15s + indicator — UPAManagerDashboard | 155f8f1 | UPAManagerDashboard.tsx, UPAManagerDashboard.test.tsx |

## What Was Built

**DoctorDashboard.tsx:**
- Added `useCallback` import alongside existing imports
- New state: `ultimaAtualizacao: Date | null`
- `fetchTurno` extracted as `useCallback` — calls `turnosApi.meu()`, updates medico/status/history/ultimaAtualizacao, catches silently
- useEffect 1: `fetchTurno()` on mount + `setInterval(fetchTurno, 15_000)` with cleanup
- useEffect 2: clock timer at 60s (kept separate, unchanged behavior)
- JSX: "Atualizado às HH:MM" label at 10px/slate-400 right-aligned next to "Meu Turno" heading

**UPAManagerDashboard.tsx:**
- Added `useCallback` import
- New state: `ultimaAtualizacao: Date | null`
- `fetchDados` extracted as `useCallback` — `Promise.all([medicosApi, alertasApi, turnosApi])`, updates all state + ultimaAtualizacao, catches silently; depends on `usuario?.upa_id`
- useEffect: `fetchDados().finally(() => setIsLoading(false))` on mount + `setInterval(fetchDados, 15_000)` with cleanup
- JSX: "Atualizado às HH:MM" label at 10px/slate-400 right-aligned next to "Painel da UPA" heading

## Test Results

```
DoctorDashboard.test.tsx     5/5 passed
UPAManagerDashboard.test.tsx 5/5 passed
Full suite                  65/68 passed (3 unrelated pre-existing failures in CitizenPortal worktree)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 4 timeout with waitFor under fake timers**
- **Found during:** Task 1 verification
- **Issue:** `waitFor(() => screen.getByText(/Atualizado às/))` hangs indefinitely when `vi.useFakeTimers()` is active because waitFor's internal polling uses real timers
- **Fix:** Replaced `waitFor` with `act(async () => { await Promise.resolve() })` to flush microtasks synchronously
- **Files modified:** src/tests/DoctorDashboard.test.tsx
- **Commit:** f7138fa (same commit)

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. The polling calls existing authenticated endpoints already covered by T-03-06 through T-03-10 in the plan's threat model.

## Known Stubs

None. Both dashboards wire real API calls and render real data.

## Self-Check: PASSED

- src/components/DoctorDashboard.tsx — modified, committed f7138fa
- src/tests/DoctorDashboard.test.tsx — created, committed f7138fa
- src/components/UPAManagerDashboard.tsx — modified, committed 155f8f1
- src/tests/UPAManagerDashboard.test.tsx — created, committed 155f8f1
