# Phase 01: Recuperacao de Senha - Research

**Researched:** 2026-04-12
**Domain:** Django DRF password reset + React 19 frontend flow
**Confidence:** HIGH

---

## Summary

The project already has all the infrastructure needed for password reset: a `TokenAtivacao` model with UUID token, expiry, and single-use flag; an `email_service.py` function that renders branded HTML email; and a frontend pattern in `AtivarConta.tsx` that validates token then sets password. Password reset is a parallel flow to account activation — same shape, different purpose.

The key design decision is whether to reuse `TokenAtivacao` or create a separate model. The analysis below recommends a **separate `TokenRedefinicaoSenha` model**. The existing model has `OneToOneField` on `usuario`, meaning only one token can exist per user at a time. For activation this is fine (one-time event), but for password reset users may request multiple times. A separate model also keeps audit trails clean and avoids overloading a single model with two semantics.

Token security: the codebase already uses `secrets.token_urlsafe(48)` which produces 64 URL-safe characters (384 bits of entropy). This is superior to Django's `PasswordResetTokenGenerator` (which is HMAC-based and tied to password hash) and consistent with the existing pattern. Stick with `secrets.token_urlsafe(48)`.

**Primary recommendation:** New `TokenRedefinicaoSenha` model (ForeignKey, not OneToOneField), reuse `enviar_email_ativacao()` with a new keyword or create a parallel `enviar_email_redefinicao_senha()`. Frontend adds two new views (`EsqueciSenha`, `RedefinirSenha`) and uses the existing URL param pattern from `App.tsx`.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 6.x | ORM, email, `timezone.now()` | Already in use |
| djangorestframework | latest | `@api_view`, `AllowAny`, `Response` | Already in use |
| `secrets` (stdlib) | — | `token_urlsafe(48)` — 384-bit token | Already used in serializers.py |
| `django.core.mail.send_mail` | — | Email dispatch | Already used in email_service.py |

### Frontend (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component model | Already in use |
| motion/react | latest | `motion.div` animations | Already used in AtivarConta.tsx, LoginPage.tsx |
| lucide-react | latest | Icons | Already used throughout |
| Tailwind CSS | v4 | Styling | Already in use |

No new packages need to be installed for this phase.

---

## Architecture Patterns

### Token Model: New Separate Model (Recommended)

`TokenAtivacao` uses `OneToOneField` — only one token per user. For password reset, a user may click "esqueci senha" multiple times. Use `ForeignKey` so old tokens remain in DB (marked `usado=True`) and a fresh one can be issued.

```python
# [VERIFIED: codebase — mirrors existing TokenAtivacao pattern]
class TokenRedefinicaoSenha(models.Model):
    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='tokens_redefinicao'
    )
    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'tokens_redefinicao_senha'
```

Expiry: 1 hour (vs 24h for activation — reset tokens should be shorter-lived).

When user requests a new token, mark any existing unused tokens for that user as `usado=True` before creating a new one. This invalidates old links if the user clicks multiple times.

### Backend: Two Endpoints

**Endpoint 1 — Request reset:**
```python
# POST /api/auth/esqueci-senha/
# Body: { "email": "user@example.com" }
# Response: always 200 (do not reveal whether email exists)
@api_view(['POST'])
@permission_classes([AllowAny])
def esqueci_senha(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'erro': 'Email obrigatório.'}, status=400)
    try:
        usuario = Usuario.objects.get(email=email, is_active=True)
        # Invalidate old tokens
        usuario.tokens_redefinicao.filter(usado=False).update(usado=True)
        token_str = secrets.token_urlsafe(48)
        TokenRedefinicaoSenha.objects.create(
            usuario=usuario,
            token=token_str,
            expira_em=timezone.now() + timedelta(hours=1),
        )
        enviar_email_redefinicao_senha(usuario.nome, usuario.email, token_str)
    except Usuario.DoesNotExist:
        pass  # Silent — do not leak user existence
    return Response({'mensagem': 'Se o email estiver cadastrado, enviaremos as instruções.'})
```

**Endpoint 2 — Confirm reset:**
```python
# POST /api/auth/redefinir-senha/
# Body: { "token": "...", "senha": "nova_senha" }
@api_view(['POST'])
@permission_classes([AllowAny])
def redefinir_senha(request):
    token_str = request.data.get('token', '')
    senha = request.data.get('senha', '')
    if not token_str or not senha:
        return Response({'erro': 'Token e senha são obrigatórios.'}, status=400)
    if len(senha) < 6:
        return Response({'erro': 'A senha deve ter pelo menos 6 caracteres.'}, status=400)
    try:
        t = TokenRedefinicaoSenha.objects.get(token=token_str, usado=False)
    except TokenRedefinicaoSenha.DoesNotExist:
        return Response({'erro': 'Link inválido ou já utilizado.'}, status=400)
    if timezone.now() > t.expira_em:
        return Response({'erro': 'Este link expirou. Solicite um novo.'}, status=400)
    t.usuario.set_password(senha)
    t.usuario.save()
    t.usado = True
    t.save()
    return Response({'mensagem': 'Senha redefinida com sucesso! Você já pode fazer login.'})
```

Note: No `GET /api/auth/redefinir-senha/<token>/` is needed. The frontend can call the POST endpoint directly — or optionally add a GET to pre-validate the token and show the user's name (mirrors `verificar_token_ativacao`). Adding a GET validation endpoint is a small UX improvement (show "Redefinindo senha para usuario@email.com") and is consistent with the existing pattern.

### URL Registration

```python
# api/urls.py — add to urlpatterns
path('auth/esqueci-senha/', views.esqueci_senha),
path('auth/redefinir-senha/', views.redefinir_senha),
path('auth/redefinir-senha/<str:token>/', views.verificar_token_redefinicao),  # optional GET
```

### Email Function

Add to `email_service.py` — parallel to `enviar_email_ativacao()`, same HTML structure:

```python
def enviar_email_redefinicao_senha(nome: str, email: str, token: str):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    link = f'{frontend_url}/?reset_token={token}'  # Different param to distinguish from activation
    # HTML mirrors existing template — header, body with CTA button, footer
    # Subject: "Redefinição de senha — MedBusca"
    # CTA: "Redefinir minha senha"
    # Expiry note: "Este link expira em 1 hora."
```

Using `?reset_token=` (not `?token=`) differentiates password reset links from activation links in `App.tsx`.

### Frontend Routing

`App.tsx` uses `window.location.search` URL params, not React Router. The existing pattern:

```typescript
// App.tsx — existing pattern for activation
const tokenAtivacao = new URLSearchParams(window.location.search).get('token');
if (tokenAtivacao) {
  return <AtivarConta token={tokenAtivacao} onSuccess={...} />;
}
```

Mirror this for reset:

```typescript
// Add after existing tokenAtivacao check
const resetToken = new URLSearchParams(window.location.search).get('reset_token');
if (resetToken) {
  return <RedefinirSenha token={resetToken} onSuccess={...} />;
}
```

And add a new view state for the request screen:

```typescript
// currentView === 'esqueci_senha' renders <EsqueciSenha onBack={() => setCurrentView('login')} />
```

### Frontend Components

**`EsqueciSenha.tsx`** — Triggered by clicking "Esqueci minha senha" in LoginPage:
- Single email input
- Calls `POST /api/auth/esqueci-senha/`
- On success: shows confirmation message ("Se o email estiver cadastrado...")
- No error state reveals user existence — show same message regardless

**`RedefinirSenha.tsx`** — Rendered when `?reset_token=` is in URL:
- Same structure as `AtivarConta.tsx`
- `useEffect` on mount: optional GET to validate token and show user name
- Form: nova senha + confirmar senha (same validation as AtivarConta)
- Calls `POST /api/auth/redefinir-senha/`
- Success: redirect to login (same `setTimeout + window.location.reload()` pattern)

**LoginPage.tsx change** — The "Esqueci minha senha" button already exists (line 170-176) but is a no-op. Wire it to navigate to `esqueci_senha` view:

```typescript
// The button already has the right JSX — just add onClick
<button
  type="button"
  onClick={() => { /* call onEsqueciSenha prop or onNavigate('esqueci_senha') */ }}
  className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
>
  Esqueci minha senha
</button>
```

`LoginPage` receives an `onEsqueciSenha?: () => void` prop, App.tsx passes `() => setCurrentView('esqueci_senha')`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Secure token generation | Custom UUID/random | `secrets.token_urlsafe(48)` — already in codebase |
| Password hashing | Manual bcrypt | `user.set_password(senha)` — Django handles it |
| Token expiry | Cron job | `timezone.now() > t.expira_em` at read time — already the pattern |
| Email HTML | Inline CSS from scratch | Extend `email_service.py` with same template shell |

---

## Common Pitfalls

### Pitfall 1: User Enumeration via Email Check
**What goes wrong:** Returning `{'erro': 'Email nao encontrado.'}` reveals whether an email is registered — a privacy/security leak.
**Why it happens:** Natural to return 404 on missing email.
**How to avoid:** Always return 200 with the same generic message whether the email exists or not. The existing code in `esqueci_senha` above does this with the `try/except` that silently passes.
**Warning signs:** Any branch that returns a different HTTP status or message for "email found" vs "email not found."

### Pitfall 2: OneToOneField Breaks Multiple Reset Requests
**What goes wrong:** If `TokenRedefinicaoSenha` uses `OneToOneField`, the second reset request raises `IntegrityError` because a token already exists.
**Why it happens:** Copying `TokenAtivacao` structure exactly.
**How to avoid:** Use `ForeignKey`. Before creating a new token, call `.filter(usado=False).update(usado=True)` to invalidate stale ones.

### Pitfall 3: Same URL Param as Activation (`?token=`)
**What goes wrong:** A password reset email link hits `App.tsx` and renders `AtivarConta` instead of `RedefinirSenha` because both use `?token=`.
**Why it happens:** Copying the activation link format.
**How to avoid:** Use `?reset_token=` in reset emails. The check order in `App.tsx` matters — activation check comes first currently.

### Pitfall 4: Hardcoded `localhost:8000` in New Component
**What goes wrong:** `AtivarConta.tsx` line 21 has `fetch('http://localhost:8000/api/ativar/...')` — hardcoded. Any new component that copies this pattern will break in production.
**Why it happens:** Development shortcut.
**How to avoid:** Use the `apiFetch` utility from `src/services/api.ts` (or the `BASE_URL` constant) for all fetch calls in new components. The `api.ts` file uses `__API_URL__` injected by Vite.

### Pitfall 5: Token Not Marked Used on Successful Reset
**What goes wrong:** User resets password, then uses the same link again to set a different password.
**Why it happens:** Forgetting `t.usado = True; t.save()`.
**How to avoid:** Same pattern as `ativar_conta` view — set used flag before returning success response.

### Pitfall 6: No Migration for New Model
**What goes wrong:** Model added to `models.py` but `makemigrations` not run before deploy.
**How to avoid:** `python manage.py makemigrations api` and commit the migration file alongside the model change.

---

## Code Examples

### Token generation pattern (from serializers.py — VERIFIED)
```python
# Source: api/serializers.py lines 54-62
token_str = secrets.token_urlsafe(48)
TokenAtivacao.objects.create(
    usuario=user,
    token=token_str,
    expira_em=timezone.now() + timedelta(hours=24),
)
```
Reset version uses `timedelta(hours=1)`.

### Token validation pattern (from views.py — VERIFIED)
```python
# Source: api/views.py lines 365-394
try:
    t = TokenAtivacao.objects.get(token=token_str, usado=False)
except TokenAtivacao.DoesNotExist:
    return Response({'erro': 'Link inválido ou já utilizado.'}, status=400)
if timezone.now() > t.expira_em:
    return Response({'erro': 'Este link expirou.'}, status=400)
```

### Frontend URL param detection (from App.tsx — VERIFIED)
```typescript
// Source: App.tsx lines 86-95
const tokenAtivacao = new URLSearchParams(window.location.search).get('token');
if (tokenAtivacao) {
  return <AtivarConta token={tokenAtivacao} onSuccess={...} />;
}
```

### Frontend API call pattern (from AtivarConta.tsx — NOTE HARDCODING)
```typescript
// Source: AtivarConta.tsx lines 21-28 — DO NOT COPY localhost:8000
// New components should use apiFetch from src/services/api.ts instead:
import { apiFetch } from '../services/api';  // or use raw fetch with BASE_URL
const data = await apiFetch<{mensagem: string}>('/auth/esqueci-senha/', {
  method: 'POST',
  body: JSON.stringify({ email }),
});
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Django's built-in `PasswordResetTokenGenerator` (HMAC) | `secrets.token_urlsafe(48)` stored in DB | Project already chose DB-stored tokens — consistent to continue |
| Redirect to page with `uid64/token` in URL path | `?reset_token=` query param | Matches existing activation pattern in this project |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 1-hour expiry for reset tokens is appropriate | Architecture Patterns | Too short frustrates users; too long is a security window |
| A2 | `apiFetch` from `api.ts` is available for use in new components | Code Examples | Minor — if not exported, add export or use fetch directly with `__API_URL__` |

---

## Open Questions

1. **Token validation GET endpoint for RedefinirSenha**
   - What we know: `AtivarConta.tsx` calls `GET /api/ativar/<token>/` to show the user's name before they set a password. This is a UX nicety, not a security requirement.
   - What's unclear: Is showing the user's name/email on the reset screen wanted?
   - Recommendation: Add the GET endpoint. It costs ~10 lines of backend code and improves trust ("resetting password for usuario@email.com").

2. **Minimum password length**
   - What we know: `ativar_conta` enforces `len(senha) < 6`. `AtivarConta.tsx` enforces the same on the frontend.
   - What's unclear: Should reset use a stronger requirement (e.g., 8 chars)?
   - Recommendation: Keep at 6 for consistency. Can increase independently later.

3. **Rate limiting on `esqueci-senha/`**
   - What we know: No rate limiting exists anywhere in the project currently.
   - What's unclear: Whether Render's hosting or an upstream proxy handles this.
   - Recommendation: Document as a known gap. For a TCC/MVP, this is acceptable. A note in comments is enough.

---

## Environment Availability

Step 2.6: SKIPPED — this phase uses only packages already installed in the project. No new external dependencies. Email service (`send_mail`) is already configured and working (used in `UsuarioCriarSerializer`).

---

## Validation Architecture

No dedicated test framework detected in the project (`pytest.ini`, `jest.config.*`, `vitest.config.*` not present beyond Vite's default). Manual smoke testing is the validation approach for this phase.

### Phase Smoke Test Checklist (manual)

| Test | Command / Action | Expected |
|------|-----------------|----------|
| Request reset for valid email | `POST /api/auth/esqueci-senha/ {"email": "valid@test.com"}` | 200 + generic message; email sent |
| Request reset for invalid email | `POST /api/auth/esqueci-senha/ {"email": "noone@test.com"}` | 200 + same generic message; no email |
| Use valid token | `POST /api/auth/redefinir-senha/ {"token": "...", "senha": "nova123"}` | 200 + success message |
| Reuse token | Same POST again | 400 "Link inválido ou já utilizado" |
| Expired token | Insert token with `expira_em` in past, POST | 400 "Este link expirou" |
| Weak password | `POST` with `senha: "12"` | 400 "A senha deve ter pelo menos 6 caracteres" |
| Frontend — link in email | Click `?reset_token=...` URL | Renders RedefinirSenha, not AtivarConta |
| Frontend — login after reset | Login with new password | Success |

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `api/models.py` — `TokenAtivacao` model structure (OneToOneField, token, expira_em, usado)
- `api/email_service.py` — email template structure and `send_mail` usage
- `api/views.py` — `verificar_token_ativacao` and `ativar_conta` implementation patterns
- `api/serializers.py` — `secrets.token_urlsafe(48)` token generation pattern
- `api/urls.py` — URL registration pattern
- `src/App.tsx` — URL param detection pattern (`window.location.search`)
- `src/components/AtivarConta.tsx` — Frontend component structure to mirror
- `src/components/LoginPage.tsx` — Existing "Esqueci minha senha" button location
- `src/services/api.ts` — `apiFetch` utility and `BASE_URL` injection

### Secondary (ASSUMED)
- 1-hour token expiry as industry norm for password reset [ASSUMED]
- User enumeration via email as a known security pitfall [ASSUMED — well-established OWASP guidance]

---

## Metadata

**Confidence breakdown:**
- Backend model/endpoint pattern: HIGH — directly mirrors existing working code
- Frontend component pattern: HIGH — directly mirrors AtivarConta.tsx
- Token security choice: HIGH — `secrets.token_urlsafe(48)` already in use
- Email template approach: HIGH — extends existing email_service.py
- Rate limiting gap: HIGH — confirmed absent in codebase, flagged as known gap

**Research date:** 2026-04-12
**Valid until:** Stable — no fast-moving dependencies involved
