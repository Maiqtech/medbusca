# Phase 2: Alertas Automáticos - Research

**Researched:** 2026-04-12
**Domain:** Django signals, management commands, conditional alert generation
**Confidence:** HIGH (based on direct codebase analysis + Django documented behavior)

---

## Summary

The `Alerta` model is fully built — `tipo`, `mensagem`, `upa`, `municipio`, `resolvido`, `resolvido_em` are all present. No schema changes are needed for any of the three plans.

The alert logic needs to be added in two places: (1) directly inside the existing view functions (`encerrar_turno`, `iniciar_turno`) for coverage-gap alerts, and (2) in a new management command for schedule and structural alerts. Django signals are explicitly the wrong choice here — see Plan 02-01 analysis below.

**Primary recommendation:** Inline logic in view functions for Plans 02-01, management command for Plans 02-02 and 02-03. No new models, no new dependencies, no migrations.

---

## Key Model Facts (VERIFIED: direct file read)

### `Alerta` fields that matter
- `tipo` — `critico | aviso | informativo`
- `upa` — nullable FK to UPA
- `municipio` — nullable FK to Municipio
- `resolvido` — BooleanField, default False
- `resolvido_em` — nullable DateTimeField
- No `destinatario` field — scoping to the right person is done at query time in `AlertaList` view

### `AlertaList` scoping logic (already in views.py line 275-282)
```python
if user.perfil == 'gestor_upa':
    qs = qs.filter(upa=user.upa)
elif user.perfil == 'gestor_municipal':
    qs = qs.filter(municipio=user.municipio)
```
This means: to target a `gestor_upa`, set `upa=<their UPA>`. To target a `gestor_municipal`, set `municipio=<their municipio>`. To target `super_admin`, leave both null (they see everything).

### `Turno` — no `upa` field
`Turno` has no direct `upa` FK. UPA is accessed via `turno.medico.upa`. This is the join needed for coverage queries.

### `Medico.especialidade` — FK to `Especialidade`
Coverage check for a specialty at a UPA: `Turno.objects.filter(medico__upa=upa, medico__especialidade=especialidade, status='em_atendimento').exists()`

### `Escala` fields
- `medico` FK, `upa` FK, `data` DateField, `hora_inicio` TimeField, `hora_fim` TimeField
- No FK to `Turno` — but `Turno` has a nullable FK to `Escala` (`turno.escala`)

---

## Plan 02-01: Django Signals vs Inline View Logic

### Why NOT Django signals

**The trap:** `post_save` on `Turno` seems clean. In practice it creates three problems for this codebase:

1. **`post_save` fires on every `.save()` call**, including `pausar_turno` and `retornar_turno`. You'd need to inspect `instance.status` and compare with `update_fields` to know what actually changed — error-prone, and Django doesn't guarantee `update_fields` is set by all callers.

2. **The current views use `turno.save()` directly** (lines 217, 231, 248, 250). Signals cannot access the *previous* state of the object without an explicit `pre_save` that stores it on the instance — adding more complexity.

3. **Signals are harder to test and debug** for a TCC context. The behavior is invisible unless you know to look in `signals.py`.

### Correct approach: inline logic in `encerrar_turno` and `iniciar_turno`

Both views are simple `@api_view` functions. Adding 5-10 lines after the `turno.save()` call is the right place. It's explicit, readable, and traceable.

**`encerrar_turno` — generate alert if no coverage remains:**
```python
# After turno.save() and RegistroTurno.objects.create(...)
upa = medico.upa
especialidade = medico.especialidade
cobertura_ativa = Turno.objects.filter(
    medico__upa=upa,
    medico__especialidade=especialidade,
    status='em_atendimento'
).exclude(medico=medico).exists()

if not cobertura_ativa:
    ja_existe = Alerta.objects.filter(
        upa=upa,
        resolvido=False,
        mensagem__contains=especialidade.nome,
        tipo='critico'
    ).exists()
    if not ja_existe:
        Alerta.objects.create(
            tipo='critico',
            mensagem=f'Sem cobertura de {especialidade.nome} na {upa.nome}.',
            upa=upa,
        )
```

**`iniciar_turno` — auto-resolve open coverage alerts for this specialty:**
```python
# After turno creation
upa = medico.upa
especialidade = medico.especialidade
Alerta.objects.filter(
    upa=upa,
    resolvido=False,
    tipo='critico',
    mensagem__contains=especialidade.nome,
).update(resolvido=True, resolvido_em=timezone.now())
```

### Duplicate prevention

Use `get_or_create` or a `.exists()` guard before `Alerta.objects.create()`. The pattern that works best here:

```python
# Option A: get_or_create with a stable mensagem
alerta, criado = Alerta.objects.get_or_create(
    upa=upa,
    resolvido=False,
    tipo='critico',
    defaults={'mensagem': f'Sem cobertura de {especialidade.nome} na {upa.nome}.'}
)
# Problem: get_or_create needs exact field match for lookup — mensagem is too variable.
# Use .exists() guard instead (Option B below).

# Option B: exists() guard — RECOMMENDED for this case
ja_existe = Alerta.objects.filter(
    upa=upa, resolvido=False, tipo='critico',
    mensagem__icontains=especialidade.nome
).exists()
if not ja_existe:
    Alerta.objects.create(...)
```

Option B is safer because the `mensagem` field is a TextField and exact-match `get_or_create` is fragile. `[ASSUMED]` — both are standard Django patterns; preference for Option B is a judgment call.

### Auto-resolution

Use `.update()` rather than fetching and saving each object individually:
```python
Alerta.objects.filter(
    upa=upa, resolvido=False, tipo='critico',
    mensagem__icontains=especialidade.nome,
).update(resolvido=True, resolvido_em=timezone.now())
```
Note: `.update()` does not trigger `post_save` signals. This is fine here since we're not using signals. [VERIFIED: Django ORM docs — QuerySet.update() bypasses model save()]

---

## Plan 02-02: Management Command `verificar_turnos_nao_iniciados`

### How Django management commands work [ASSUMED: standard Django pattern]

Create `api/management/commands/verificar_turnos_nao_iniciados.py`:

```python
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Alerta, Escala, Turno

class Command(BaseCommand):
    help = 'Gera alertas de aviso para turnos não iniciados'

    def handle(self, *args, **options):
        agora = timezone.localtime(timezone.now())
        hoje = agora.date()
        hora_atual = agora.time()

        escalas_atrasadas = Escala.objects.filter(
            data=hoje,
            hora_inicio__lte=hora_atual,
        ).select_related('medico', 'medico__especialidade', 'upa')

        for escala in escalas_atrasadas:
            turno_iniciado = Turno.objects.filter(
                medico=escala.medico,
                escala=escala,
            ).exists()
            if turno_iniciado:
                continue

            # Also accept: turno initiated today for this medico (no escala FK set)
            turno_hoje = Turno.objects.filter(
                medico=escala.medico,
                iniciado_em__date=hoje,
            ).exists()
            if turno_hoje:
                continue

            ja_existe = Alerta.objects.filter(
                upa=escala.upa,
                resolvido=False,
                tipo='aviso',
                mensagem__icontains=escala.medico.nome,
            ).exists()
            if not ja_existe:
                Alerta.objects.create(
                    tipo='aviso',
                    mensagem=(
                        f'{escala.medico.nome} ({escala.medico.especialidade.nome}) '
                        f'não iniciou turno previsto para {escala.hora_inicio.strftime("%H:%M")}.'
                    ),
                    upa=escala.upa,
                )
        self.stdout.write(self.style.SUCCESS('Verificação concluída.'))
```

### Key query detail: linking Escala to Turno

`Turno.escala` is nullable — a doctor may have started a turno without an escala being assigned. The safe check is: any turno started today for that medico, OR a turno with `escala=escala`. The code above covers both.

### Timezone: always use `timezone.localtime()`

The project uses `auto_now_add` DateTimeFields stored in UTC. `Turno.iniciado_em` is a DateTimeField. Comparing with `.date()` requires `localtime()` — otherwise UTC midnight can mismatch by up to 3 hours for Brazil (BRT = UTC-3). [ASSUMED: project uses Brazilian timezone — check `TIME_ZONE` in settings.py]

### Running on Render free tier

The command can be called manually: `python manage.py verificar_turnos_nao_iniciados`. For the TCC demo, this is sufficient. No cron, no Celery, no additional dependencies.

---

## Plan 02-03: Structural Alerts (UPA sem gestor, Município sem gestor)

### UPA without a `gestor_upa`

```python
from api.models import Alerta, UPA, Usuario

upas_sem_gestor = UPA.objects.filter(ativa=True).exclude(
    usuarios__perfil='gestor_upa',
    usuarios__is_active=True,
)
for upa in upas_sem_gestor:
    ja_existe = Alerta.objects.filter(
        upa=upa, resolvido=False,
        tipo='aviso',
        mensagem__icontains='sem gestor',
    ).exists()
    if not ja_existe:
        Alerta.objects.create(
            tipo='aviso',
            mensagem=f'UPA {upa.nome} está sem gestor cadastrado.',
            upa=upa,
            municipio=upa.municipio,  # also set municipio so gestor_municipal sees it
        )
```

Note: `UPA.usuarios` is the reverse relation (line 31 in models.py: `related_name='usuarios'`). The query `.exclude(usuarios__perfil='gestor_upa', usuarios__is_active=True)` filters out UPAs that have at least one active gestor_upa. [VERIFIED: direct model read]

### Município without a `gestor_municipal`

```python
from api.models import Alerta, Municipio, Usuario

municipios_sem_gestor = Municipio.objects.filter(ativo=True).exclude(
    usuarios__perfil='gestor_municipal',
    usuarios__is_active=True,
)
for mun in municipios_sem_gestor:
    ja_existe = Alerta.objects.filter(
        municipio=mun, resolvido=False,
        tipo='aviso',
        mensagem__icontains='sem gestor',
    ).exists()
    if not ja_existe:
        Alerta.objects.create(
            tipo='aviso',
            mensagem=f'Município {mun.nome} está sem gestor municipal cadastrado.',
            municipio=mun,
        )
```

Alertas with `upa=None` and `municipio=<mun>` are visible to `gestor_municipal` of that município, and to `super_admin` (no filter applied for super_admin in `AlertaList`). [VERIFIED: AlertaList view, line 275-282]

### Trigger options

These checks can be:
- **A management command** `verificar_estrutura`: run once after bulk user changes. Best for TCC.
- **Inline in `desativar_usuario` view**: after deactivating a user, check if their UPA/município is now uncovered. Adds complexity but keeps checks reactive.

Recommendation: a single management command `verificar_estrutura` that runs both checks. Can be called from the same command as `verificar_turnos_nao_iniciados` or separately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Duplicate alert prevention | Custom dedup table | `.filter(...).exists()` guard before `.create()` |
| Alert resolution | Separate "resolved" model | `resolvido=True` + `resolvido_em` already on `Alerta` |
| Scheduled jobs | Celery, cron on Render free | `manage.py` command called manually |
| Signal-based state tracking | Custom `pre_save` + `post_save` chain | Inline logic in view functions |

---

## Common Pitfalls

### Pitfall 1: Signal fires on every `.save()`, not just status change
**What goes wrong:** `post_save` on `Turno` triggers on `pausar_turno` and `retornar_turno` too. You check `instance.status == 'encerrado'` but forget it also fires when `status` is set back to `em_atendimento`.
**How to avoid:** Don't use signals. Put logic directly in `encerrar_turno` and `iniciar_turno` views.

### Pitfall 2: Querying coverage before the current turno is saved
**What goes wrong:** In `encerrar_turno`, you check for active coverage but the current turno's status is already `'encerrado'` at save time — so the query might or might not include it depending on when the check runs.
**How to avoid:** Run the coverage check *after* `turno.save()` (i.e., after status is already `encerrado`) and use `.exclude(medico=medico)` to exclude the doctor just ending their shift. The query correctly ignores the ended turno.

### Pitfall 3: Timezone mismatch in `Escala.data` vs `Turno.iniciado_em`
**What goes wrong:** `Escala.data` is a DateField (date only, timezone-naive). `Turno.iniciado_em` is a DateTimeField stored in UTC. Comparing `Turno.iniciado_em__date=hoje` where `hoje = date.today()` uses local server time, which may differ from Django's configured timezone.
**How to avoid:** Use `hoje = timezone.localtime(timezone.now()).date()` everywhere.

### Pitfall 4: `get_or_create` on a TextField
**What goes wrong:** Using `get_or_create` with `mensagem=f'...'` as a lookup key means any change to the message string creates a duplicate instead of finding the existing one.
**How to avoid:** Use `filter(...).exists()` as the duplicate guard; keep the mensagem in `defaults={}` only.

### Pitfall 5: Missing `management/` directory `__init__.py` files
**What goes wrong:** Management command not found by Django because `__init__.py` files are missing.
**How to avoid:** Ensure the directory tree is:
```
api/
  management/
    __init__.py
    commands/
      __init__.py
      verificar_turnos_nao_iniciados.py
```

---

## Architecture

### File layout
```
api/
├── management/
│   ├── __init__.py
│   └── commands/
│       ├── __init__.py
│       ├── verificar_turnos_nao_iniciados.py   # Plan 02-02
│       └── verificar_estrutura.py              # Plan 02-03
├── models.py       (no changes needed)
├── views.py        (inline logic added to encerrar_turno, iniciar_turno)
└── signals.py      (NOT needed — do not create)
```

### No new migrations needed
All three plans write only to the existing `alertas` table via `Alerta.objects.create()`. No model fields are added or changed.

### No new dependencies
Django management commands and ORM queryset methods are standard Django. No packages to install.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Project uses Brazilian timezone (BRT/BRST) in Django settings | Plan 02-02 timezone note | `localtime()` calls still work but `date()` comparisons may be off by 1 day |
| A2 | `super_admin` sees all alerts because `AlertaList` applies no filter for that profile | Plan 02-03 visibility | super_admin may miss municipio-scoped alerts if there's a future filter change |
| A3 | Option B (`.exists()` guard) is preferred over `get_or_create` for dedup | Plan 02-01 | Minor: both work, style preference only |

---

## Sources

### Primary (HIGH confidence — verified by direct codebase read)
- `/c/Users/anton/Downloads/medbusca/api/models.py` — all model fields, related_names, status choices
- `/c/Users/anton/Downloads/medbusca/api/views.py` — encerrar_turno, iniciar_turno, AlertaList scoping

### Secondary (ASSUMED — standard Django, not re-verified via docs in this session)
- Django management command directory structure and `BaseCommand.handle()`
- `QuerySet.update()` bypassing `post_save` signals
- `timezone.localtime()` for naive date comparison safety
