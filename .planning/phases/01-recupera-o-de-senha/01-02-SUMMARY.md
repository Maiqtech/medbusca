---
phase: 01-recupera-o-de-senha
plan: "02"
subsystem: frontend
tags: [password-reset, react, typescript, routing]
dependency_graph:
  requires: [01-01]
  provides: [frontend-password-reset-flow]
  affects: [src/App.tsx, src/components/LoginPage.tsx]
tech_stack:
  added: []
  patterns: [prop-callback routing, URL param detection, passwordApi namespace]
key_files:
  created:
    - src/components/EsqueciSenha.tsx
    - src/components/RedefinirSenha.tsx
  modified:
    - src/services/api.ts
    - src/App.tsx
    - src/components/LoginPage.tsx
decisions:
  - passwordApi.redefinirSenha sends { token: reset_token, nova_senha } to match backend request.data.get('token')
  - resetToken URL detection placed before useState hooks (same pattern as tokenAtivacao)
  - EsqueciSenha shows success state in place (no redirect) — email not confirmed
  - RedefinirSenha redirects after 2500ms via onSuccess callback
  - esqueci_senha and redefinir_senha added to PlaceholderPage exclusion list
metrics:
  duration: ~15min
  completed: 2026-04-12
  tasks_completed: 2
  files_changed: 5
---

# Phase 01 Plan 02: Frontend Password Reset Flow Summary

JWT-free password reset UI: EsqueciSenha (email request) and RedefinirSenha (token + new password), wired through App.tsx URL param detection and view routing, with LoginPage button connected via onEsqueciSenha prop.

## What Was Implemented

**src/services/api.ts** — appended `passwordApi` namespace with two methods:
- `esqueciSenha(email)` — POST /auth/esqueci-senha/
- `redefinirSenha(reset_token, nova_senha)` — POST /auth/redefinir-senha/ with body `{ token: reset_token, nova_senha }` (backend reads `request.data.get('token')`)

**src/components/EsqueciSenha.tsx** — self-contained screen. Accepts an email, calls `passwordApi.esqueciSenha`, shows success state in-place (no redirect). Mirrors AtivarConta.tsx visual pattern exactly (logo block, motion card, input/button/error classes).

**src/components/RedefinirSenha.tsx** — receives `resetToken: string` and `onSuccess: () => void` props. Validates password length (min 6) and match client-side before calling `passwordApi.redefinirSenha`. Shows success state then calls `onSuccess` after 2500ms. Eye/EyeOff toggle shared across both password fields.

**src/App.tsx** — three additions:
1. Imports for EsqueciSenha and RedefinirSenha
2. `?reset_token=` URL param detection block immediately after the existing `?token=` (tokenAtivacao) block — before first useState
3. `esqueci_senha` and `redefinir_senha` view conditionals; `onEsqueciSenha` prop passed to LoginPage; both new views added to PlaceholderPage exclusion list

**src/components/LoginPage.tsx** — added optional `onEsqueciSenha?: () => void` prop and wired it to the "Esqueci minha senha" button's `onClick`.

## Verification

`npx tsc --noEmit` — zero errors across all modified files.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data flows are wired to real API calls via `passwordApi`.

## Threat Flags

None — no new network endpoints or auth paths introduced in the frontend; all surface was already modelled in the plan's threat register.

## Self-Check: PASSED

- src/components/EsqueciSenha.tsx — created
- src/components/RedefinirSenha.tsx — created
- src/services/api.ts — passwordApi appended
- src/App.tsx — resetToken block + view routing + onEsqueciSenha
- src/components/LoginPage.tsx — onEsqueciSenha prop wired
- Commit ed2ba4c — confirmed
