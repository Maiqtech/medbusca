---
phase: 03-polling-em-tempo-real
plan: "01"
subsystem: frontend+backend
tags: [polling, citizen-portal, google-maps, serializer, tdd]
dependency_graph:
  requires: []
  provides: [UPAPublicaSerializer-lat-lng, CitizenPortal-polling-10s, CitizenPortal-google-maps-button]
  affects: [src/components/CitizenPortal.tsx, api/serializers.py]
tech_stack:
  added: []
  patterns: [useCallback+useEffect polling, conditional rendering on null lat/lng, TDD red-green]
key_files:
  created:
    - src/tests/CitizenPortal.test.tsx
  modified:
    - api/serializers.py
    - src/components/CitizenPortal.tsx
decisions:
  - "Use toFake: ['setInterval','clearInterval'] in vi.useFakeTimers to leave Promise microtasks on real timers — avoids waitFor timeouts while still tracking fake intervals"
  - "Polling useEffect depends on [!!results, refetchUPAs] so interval is created/destroyed when results transitions null<->array"
  - "refetchUPAs silently swallows errors — does not reset existing results on poll failure (per D-7)"
  - "Google Maps link uses rel=noopener noreferrer on target=_blank to mitigate T-03-01 (window.opener access)"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_changed: 3
---

# Phase 3 Plan 01: CitizenPortal Polling + Google Maps Summary

**One-liner:** Silent 10s polling via useCallback+setInterval on CitizenPortal with conditional Google Maps anchor links on UPA cards that have coordinates.

## What Was Built

**Task 1 — UPAPublicaSerializer lat/lng (api/serializers.py)**

Added `'latitude'` and `'longitude'` to `UPAPublicaSerializer.Meta.fields`. Both fields are `DecimalField(null=True)` on the `UPA` model and are serialized automatically by DRF — no `SerializerMethodField` needed. Verified via `python manage.py shell`.

**Task 2 — CitizenPortal polling + map button (TDD)**

RED: Created `src/tests/CitizenPortal.test.tsx` with 7 tests covering:
- No polling before first search (results === null)
- setInterval fires after search (results !== null)
- clearInterval on unmount
- No spinner (isSearching) during poll
- Map link href format (`https://www.google.com/maps?q={lat},{lng}`)
- Map link `target="_blank" rel="noopener noreferrer"`
- No map button when lat/lng are null

GREEN: Modified `src/components/CitizenPortal.tsx`:
- Added `useCallback` import
- Added `ultimaAtualizacao: Date | null` state
- Added `refetchUPAs` — calls `upasApi.listar` silently, sets results + ultimaAtualizacao, no isSearching toggle
- Added polling `useEffect` with `setInterval(refetchUPAs, 10_000)`, guard `if (!results) return`, cleanup `clearInterval`
- Added `setUltimaAtualizacao(new Date())` to `handleSearch` try block
- Added conditional `<a>` with Navigation icon inside each UPA card (only when lat && lng)
- Added "Atualizado às HH:MM" indicator below results header

## Test Results

- `CitizenPortal.test.tsx`: 7/7 pass
- Full suite: 24/24 pass, 0 regressions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.useFakeTimers() blocks Promise resolution**
- **Found during:** Task 2 GREEN
- **Issue:** Plain `vi.useFakeTimers()` intercepts microtask scheduling, causing `waitFor` to timeout in subsequent tests
- **Fix:** Used `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })` — fakes only the timer APIs needed, leaves Promise resolution on real scheduler
- **Files modified:** src/tests/CitizenPortal.test.tsx
- **Commit:** c1606a0

## Known Stubs

None — lat/lng are real model fields, polling calls the real API endpoint, map button generates dynamic URLs from actual UPA data.

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model (T-03-01 through T-03-05).

## Self-Check: PASSED

- `api/serializers.py` — modified, commit 1581588 confirmed
- `src/tests/CitizenPortal.test.tsx` — created, commit 7fb1a8d confirmed
- `src/components/CitizenPortal.tsx` — modified, commit c1606a0 confirmed
- All 3 commits present in `git log --oneline`
