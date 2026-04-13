---
phase: 03-polling-em-tempo-real
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - api/serializers.py
  - src/components/CitizenPortal.tsx
  - src/tests/CitizenPortal.test.tsx
  - src/components/DoctorDashboard.tsx
  - src/tests/DoctorDashboard.test.tsx
  - src/components/UPAManagerDashboard.tsx
  - src/tests/UPAManagerDashboard.test.tsx
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 03 added silent polling (10 s CitizenPortal, 15 s dashboards) and Google Maps links to UPA cards. The polling architecture is sound — intervals are cleaned up on unmount, stale closures are correctly avoided via `useCallback` with scoped deps, and the silent-failure strategy for network errors is intentional and consistent. The test suite is thorough and covers the right edge cases.

No critical (security/crash/data-loss) issues were found. The findings below are four warnings (correctness risks) and five informational items (code quality/test gaps).

---

## Warnings

### WR-01: Missing `onMunicipalityChange` in `useEffect` dependency array

**File:** `src/components/CitizenPortal.tsx:36-40`
**Issue:** The effect that calls `onMunicipalityChange` omits the callback from its deps array. If the parent passes a new function reference on re-render, the effect will silently hold a stale closure over the old callback. React's exhaustive-deps rule flags this as a bug.
```tsx
// Current
useEffect(() => {
  if (onMunicipalityChange && selectedMunicipio) {
    onMunicipalityChange({ name: selectedMunicipio.nome, uf: selectedMunicipio.uf });
  }
}, [selectedMunicipio]); // <-- missing onMunicipalityChange

// Fix
useEffect(() => {
  if (onMunicipalityChange && selectedMunicipio) {
    onMunicipalityChange({ name: selectedMunicipio.nome, uf: selectedMunicipio.uf });
  }
}, [selectedMunicipio, onMunicipalityChange]);
```
In practice the parent is `App.tsx` and the prop is stable, but omitting it creates a maintainability hazard and will trigger eslint-plugin-react-hooks warnings.

---

### WR-02: Polling effect depends on `!!results` (boolean coercion) instead of a stable sentinel

**File:** `src/components/CitizenPortal.tsx:70-74`
**Issue:** `!!results` converts the array reference to a boolean before React compares deps. This means the interval is created once when `results` goes from `null` → array, which is the intended behavior. However, it also means the interval is **not** recreated when `results` is reset to `null` (municipality/specialty change clears results), which is correct. But the pattern is fragile: if `results` transitions `null → [] → null → []`, the boolean stays `false → false` across the null-states and the effect never re-fires the cleanup. Because the current UI resets results to `null` on select change and then only sets it again on explicit search, this currently works — but the dependency on a coerced boolean rather than an explicit `hasSearched` flag is non-obvious and easy to break.

```tsx
// Current — fragile boolean coercion
useEffect(() => {
  if (!results) return;
  const intervalo = setInterval(refetchUPAs, 10_000);
  return () => clearInterval(intervalo);
}, [!!results, refetchUPAs]);

// Fix — use an explicit boolean state updated alongside results
const [hasSearched, setHasSearched] = useState(false);

// in handleSearch, after setResults(upas):
setHasSearched(true);
// in both select onChange, after setResults(null):
setHasSearched(false);

useEffect(() => {
  if (!hasSearched) return;
  const intervalo = setInterval(refetchUPAs, 10_000);
  return () => clearInterval(intervalo);
}, [hasSearched, refetchUPAs]);
```

---

### WR-03: `UPAPublicaSerializer.get_status_especialidade` — timezone-naive `datetime.combine` comparison

**File:** `api/serializers.py:190-191`
**Issue:** `hora_inicio = datetime.combine(proxima.data, proxima.hora_inicio)` produces a **naive** datetime. Comparing it against the timezone-aware `agora` via `.replace(tzinfo=agora.tzinfo)` forcibly attaches the server's current UTC offset rather than properly localising the datetime. When `USE_TZ=True` (Django default) and the server offset differs from `America/Bahia` (-3), the "próximo turno" window will be reported incorrectly — e.g., showing "hoje às 14:00" when the schedule is stored in local time.

```python
# Current — naive combine + manual tzinfo patch
hora_inicio = datetime.combine(proxima.data, proxima.hora_inicio)
if hora_inicio.replace(tzinfo=agora.tzinfo) > agora:

# Fix — use timezone.make_aware for correct localisation
from django.utils import timezone as tz
hora_inicio_aware = tz.make_aware(
    datetime.combine(proxima.data, proxima.hora_inicio)
)
if hora_inicio_aware > agora:
```

---

### WR-04: `UPAManagerDashboard` — `alertasApi` import but `Alerta` model was deleted in prior phase

**File:** `src/components/UPAManagerDashboard.tsx:8`
**Issue:** `alertasApi` is imported and called in `fetchDados` (line 33). According to the git log, commit `f835203` removed the `Alerta` model and all alert logic from the backend. If `alertasApi.listar()` is hitting a deleted endpoint, `Promise.all` will reject on every poll. The catch block swallows all errors silently, so no error surface is visible — but every 15 s the fetch is failing for all three data sources because `Promise.all` short-circuits on the first rejection.

```tsx
// Fix option A: remove alertasApi entirely from this component
const [m, t] = await Promise.all([
  medicosApi.listar(upaId ? { upa_id: upaId } : {}),
  turnosApi.listar(upaId ? { upa_id: upaId } : {}),
]);
setMedicos(m);
setTurnos(t);

// Fix option B: if alerts UI is intentionally kept for future use,
// fetch alerts separately so a 404 doesn't abort the other requests
```
Verify whether `alertasApi` still has a backend route. If not, remove it — the `alertas` state and the "Alertas e Observações" section will never render anyway since `alertas` will always be empty (or stale from a failed fetch).

---

## Info

### IN-01: Hardcoded UPA and specialty strings in `DoctorDashboard`

**File:** `src/components/DoctorDashboard.tsx:187, 191`
**Issue:** "Ortopedia" (line 187) and "UPA 24h Hélio Machado" (line 191) are hardcoded placeholder strings. The component already fetches `medico` data from `turnosApi.meu()` which includes `crm` and `nome`. The specialty and UPA name should come from the same response rather than being left as placeholder text visible to all doctors regardless of their actual data.

---

### IN-02: `MedicoCriarSerializer` — password sent as plain `secrets.token_urlsafe(12)` fallback

**File:** `api/serializers.py:245`
**Issue:** When `email` is provided but `senha` is not, a random password is generated via `secrets.token_urlsafe(12)` and passed to `create_user`. This password is never communicated to the user (the activation email only sends the token, not the password). The user has an account with a random unknown password they can never log in with. This may be intentional (force password reset via activation link), but it should be documented; currently there's no `set_unusable_password()` call mirroring the `UsuarioCriarSerializer` pattern from line 54.

---

### IN-03: Missing `municipality` prop usage in `CitizenPortal`

**File:** `src/components/CitizenPortal.tsx:11, 14`
**Issue:** `municipality` is declared in `CitizenPortalProps` (line 11) but is destructured with no default and never used in the component body (line 14 only destructures `onBack`, `onMunicipalityChange`, `systemName`, `systemLogo`). Either pre-select the municipality from this prop or remove it from the interface.

---

### IN-04: Test 3 (CitizenPortal) — `vi.useFakeTimers()` called after `unmount()`

**File:** `src/tests/CitizenPortal.test.tsx:147`
**Issue:** In Test 3, `vi.useFakeTimers()` is called *after* `unmount()`. The interval was set up with real timers, meaning the `clearInterval` in the cleanup was called on a real timer ID. When `vi.advanceTimersByTimeAsync(10000)` runs next, it advances fake timers that were never set — so the test assertion (`callCount` unchanged) passes trivially regardless of whether `clearInterval` actually worked. The fake timers should be established *before* the search+render sequence to make the test meaningful.

---

### IN-05: `DoctorDashboard` action handlers use `alert()` for errors

**File:** `src/components/DoctorDashboard.tsx:93, 103, 113, 123`
**Issue:** All four action handlers (`handleStart`, `handlePause`, `handleReturn`, `handleEnd`) call `alert(e.message)` on error. `alert()` blocks the main thread, is not testable (no test covers the error path), and is inconsistent with the inline error display pattern used in `CitizenPortal`. Consider using a toast/inline error state consistent with the rest of the UI.

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
