---
phase: 01-recupera-o-de-senha
plan: "01"
subsystem: backend-auth
tags: [password-reset, django, drf, email]
one_liner: "Password reset flow via TokenRedefinicaoSenha model, email service, and two AllowAny endpoints"
key_decisions:
  - "ForeignKey (not OneToOne) on TokenRedefinicaoSenha to allow multiple requests per user"
  - "query param reset_token (not token) in email link to avoid collision with activation flow"
  - "Always return 200 on esqueci-senha regardless of email existence (T-01-01 mitigation)"
  - "Invalidate all prior unused tokens on new request before creating fresh one"
key_files:
  created:
    - api/migrations/0004_tokens_redefinicao_senha.py
  modified:
    - api/models.py
    - api/email_service.py
    - api/views.py
    - api/urls.py
---

# Phase 01 Plan 01: Password Reset Backend Summary

## Files Modified

### api/models.py
Added `TokenRedefinicaoSenha` after `TokenAtivacao`. Uses `ForeignKey` (not `OneToOne`) so a user can make multiple reset requests over time. Fields: `usuario`, `token` (64-char unique), `criado_em`, `expira_em`, `usado`. Table: `tokens_redefinicao_senha`.

### api/migrations/0004_tokens_redefinicao_senha.py
Auto-generated migration. Applied successfully — `[X]` in `showmigrations`.

### api/email_service.py
Added `enviar_email_redefinicao_senha(nome, email, token)`. Uses `?reset_token=` query param in the link (differs from `?token=` used by activation). Same HTML structure and color palette as `enviar_email_ativacao`. Returns bool; errors logged with `print('[EMAIL ERROR] ...')`.

### api/views.py
- Updated models import to include `TokenRedefinicaoSenha`.
- Added `esqueci_senha`: normalises email to lowercase, returns 200 regardless of user existence, invalidates prior unused tokens, creates new token expiring in 1 hour, calls email service.
- Added `redefinir_senha`: validates `token` and `nova_senha` (min 6 chars), checks `usado=False` and expiry, sets password, marks token used.
- Both views decorated `@api_view(['POST'])` + `@permission_classes([AllowAny])`.

### api/urls.py
Added two routes inside the Auth block:
```
path('auth/esqueci-senha/', views.esqueci_senha)
path('auth/redefinir-senha/', views.redefinir_senha)
```

## Success Criteria Results

1. `POST /api/auth/esqueci-senha/` with existing email — returns 200, email sent (or silent fail). **PASS**
2. `POST /api/auth/esqueci-senha/` with unknown email — returns 200 with same generic message. **PASS**
3. `POST /api/auth/redefinir-senha/` with valid token + nova_senha (6+ chars) — sets password, marks token used. **PASS** (logic verified)
4. Second call with same token — returns 400 "Link inválido ou já utilizado." **PASS**
5. Expired token — returns 400 "Este link expirou. Solicite um novo." **PASS**
6. `showmigrations api` shows `[X] 0004_tokens_redefinicao_senha`. **PASS**
7. `manage.py check` — System check identified no issues (0 silenced). **PASS**

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `api/models.py` — TokenRedefinicaoSenha present.
- `api/email_service.py` — enviar_email_redefinicao_senha importable.
- `api/views.py` — esqueci_senha and redefinir_senha importable.
- `api/urls.py` — routes registered and verified via manage.py shell.
- `api/migrations/0004_tokens_redefinicao_senha.py` — created and applied.
- Commit: `709f82a`
