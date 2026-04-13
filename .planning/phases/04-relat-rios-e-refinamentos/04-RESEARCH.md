# Phase 4: Relatórios e Refinamentos — Research

**Researched:** 2026-04-13
**Domain:** React frontend integration + Django DRF + end-to-end flow validation
**Confidence:** HIGH

---

## Summary

Os dois endpoints de relatório (`/api/relatorios/upa/<id>/` e `/api/relatorios/municipio/<id>/`) **já estão implementados e funcionando no backend** [VERIFIED: views.py]. O frontend `ReportsDashboard.tsx` ainda usa dados mock hardcoded e não tem estado (sem `useState`/`useEffect`) [VERIFIED: codebase]. O `MunicipalManagerDashboard.tsx` **já chama** `relatoriosApi.municipio()` corretamente via `Promise.all`, mas só usa o campo `total_medicos` do payload [VERIFIED: codebase].

O plano 04-01 é portanto uma refatoração direta do `ReportsDashboard`: substituir constantes mock por chamadas `relatoriosApi.upa()` + estado + filtro de mês funcional. Nenhum backend novo é necessário. O plano 04-02 é QA dos 5 perfis — identificar e corrigir quaisquer fluxos quebrados antes da entrega.

**Recomendação principal:** Conectar `ReportsDashboard` ao `relatoriosApi.upa()` usando o padrão já estabelecido nos dashboards existentes (useEffect + useState + isLoading). Implementar filtro de mês com `<input type="month">` passando `?mes=YYYY-MM`. Para 04-02: executar cada um dos 5 fluxos manuais e registrar bugs encontrados.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R4 | ReportsDashboard conectado a `/api/relatorios/upa/<id>/` com filtro por mês | `relatoriosApi.upa(upa_id, mes?)` já existe em `api.ts`; backend retorna `medicos_ativos`, `total_horas`, `taxa_disponibilidade`, `detalhamento[]` |
| R4 | Gestor municipal visualiza relatório consolidado do município | `MunicipalManagerDashboard` já busca `relatoriosApi.municipio()` mas exibe apenas `total_medicos`; o payload também tem `total_upas`, `upas_ativas`, `upas[]` |
| R4 | Todos os 5 perfis completam fluxos principais sem erro | Plano 04-02 cobre QA manual + correção de bugs |
</phase_requirements>

---

## Estado Atual do Código (CRÍTICO)

### O que já está pronto [VERIFIED: codebase]

| Item | Status | Arquivo |
|------|--------|---------|
| `GET /api/relatorios/upa/<id>/` | Implementado | `api/views.py:273` |
| `GET /api/relatorios/municipio/<id>/` | Implementado | `api/views.py:313` |
| `relatoriosApi.upa(upa_id, mes?)` | Implementado | `src/services/api.ts:173` |
| `relatoriosApi.municipio(municipio_id)` | Implementado | `src/services/api.ts:177` |
| `MunicipalManagerDashboard` chamando `relatoriosApi.municipio()` | Implementado | `MunicipalManagerDashboard.tsx:35` |
| Rota `'reports'` renderizando `ReportsDashboard` | Implementado | `App.tsx:337` |

### O que FALTA [VERIFIED: codebase]

| Item | Problema | Arquivo |
|------|----------|---------|
| `ReportsDashboard` conectado à API | Usa `MOCK_DOCTOR_STATS` hardcoded, sem `useEffect`, sem `useState` | `ReportsDashboard.tsx:12-17` |
| Filtro "Alterar mês" em `ReportsDashboard` | Botão estático, não faz nada | `ReportsDashboard.tsx:37` |
| `MunicipalManagerDashboard` expõe payload completo | Só usa `relatorio?.total_medicos`; `total_upas`, `upas_ativas` disponíveis mas ignorados | `MunicipalManagerDashboard.tsx:75` |

---

## Contrato da API (Backend → Frontend)

### `GET /api/relatorios/upa/<id>/?mes=YYYY-MM` [VERIFIED: views.py:301]

```json
{
  "upa": { "id": 1, "nome": "UPA 24h Norte", "bairro": "Itapuã" },
  "mes": "2026-04",
  "medicos_ativos": 8,
  "total_horas": "320h",
  "taxa_disponibilidade": "87%",
  "detalhamento": [
    {
      "id": 3,
      "nome": "Dr. Carlos Lima",
      "especialidade": "Clínico Geral",
      "total_horas": "42h",
      "assiduidade": "89%",
      "status": "Online"
    }
  ]
}
```

**Observação:** `mes` aceita `"todos"` quando omitido. Passar `mes=2026-04` filtra `Turno.iniciado_em` com `startswith("2026-04")` — portanto o formato deve ser `YYYY-MM` (ISO partial). [VERIFIED: views.py:281]

**Sem paginação** — retorna todos os médicos da UPA num único payload. Para TCC com dados de teste isso é adequado.

### `GET /api/relatorios/municipio/<id>/` [VERIFIED: views.py:326]

```json
{
  "total_upas": 3,
  "upas_ativas": 2,
  "total_medicos": 24,
  "upas": [
    {
      "id": 1,
      "nome": "UPA Norte",
      "bairro": "Itapuã",
      "ativa": true,
      "total_medicos": 8,
      "em_atendimento": 2
    }
  ]
}
```

---

## Standard Stack

### Core (sem mudanças)
| Biblioteca | Versão | Papel |
|-----------|--------|-------|
| React | 19 | UI |
| TypeScript | ~5.x | Tipagem |
| Tailwind CSS | ~4.x | Estilo |
| Vitest | ~3.x | Testes unitários |
| `@testing-library/react` | instalado | Testes de componente |

**Nenhum pacote novo necessário.** Todo o padrão de integração existe nos componentes já construídos.

---

## Architecture Patterns

### Padrão estabelecido no projeto (UPAManagerDashboard) [VERIFIED: UPAManagerDashboard.tsx]

```typescript
// Fonte: src/components/UPAManagerDashboard.tsx
const [dados, setDados] = useState<any>(null);
const [isLoading, setIsLoading] = useState(true);

const fetchDados = useCallback(async () => {
  const upaId = usuario?.upa_id;
  try {
    const result = await relatoriosApi.upa(upaId, mesSelecionado);
    setDados(result);
  } catch {} // silencioso — não limpar dados em falha
}, [usuario?.upa_id, mesSelecionado]);

useEffect(() => {
  fetchDados().finally(() => setIsLoading(false));
}, [fetchDados]);
```

**Regra do projeto:** `setIsLoading(false)` apenas no `.finally()` do primeiro fetch. Polls subsequentes (se houver) não ativam loading. `ReportsDashboard` não tem polling — sem setInterval.

### Filtro por mês

```typescript
// Input nativo HTML — sem biblioteca externa
const [mesSelecionado, setMesSelecionado] = useState<string>('');

<input
  type="month"
  value={mesSelecionado}
  onChange={e => setMesSelecionado(e.target.value)}
  className="..."
/>
// Valor resultante: "2026-04" — exatamente o formato esperado pelo backend
```

Ao mudar `mesSelecionado`, `useCallback` reconstrói `fetchDados`, `useEffect` re-executa automaticamente. Sem fetch manual adicional.

### Como `ReportsDashboard` obtém o `upa_id`

`usuario?.upa_id` do `useApp()`. O serializer do backend já retorna `upa_id` em `/auth/me/` [VERIFIED: serializers.py:27]. `ReportsDashboard` já recebe `userName` e `onLogout` como props — precisa adicionar `useApp()` internamente para ler `usuario.upa_id`.

### Anti-Patterns a evitar

- **Não usar `useEffect` com `mes` direto como dep:** usar `useCallback` como nos outros dashboards — é o padrão do projeto.
- **Não mostrar spinner em re-fetches por mudança de mês:** apenas isLoading inicial (ou reset explícito ao mudar mês — ver pitfall abaixo).
- **Não substituir o gráfico de barras animado:** o gráfico com `motion.div` é puramente decorativo; os dados reais vão nos cards e na tabela de detalhamento.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez disso |
|----------|---------------|-------------------|
| Seletor de mês | Componente custom de calendário | `<input type="month">` nativo |
| Chamada autenticada à API | fetch direto | `relatoriosApi.upa()` de `api.ts` |
| Token refresh | Lógica própria | `apiFetch` já trata 401 com retry |

---

## Common Pitfalls

### Pitfall 1: `isLoading` não reseta ao mudar de mês
**O que vai errado:** Usuário muda o mês, os dados antigos ficam visíveis enquanto os novos carregam — sem indicação visual.
**Como evitar:** Ao mudar `mesSelecionado`, chamar `setIsLoading(true)` antes de `fetchDados()`. Alternativa: deixar os dados antigos (UX aceitável para TCC).
**Decisão recomendada:** Não resetar loading ao trocar mês — mantém dados visíveis, comportamento mais suave. Aceitável para TCC.

### Pitfall 2: `ReportsDashboard` não tem acesso a `usuario`
**O que vai errado:** O componente é renderizado sem `upa_id` — `relatoriosApi.upa(undefined)` chama `/api/relatorios/upa/undefined/` → 404.
**Como evitar:** Adicionar `const { usuario } = useApp()` dentro do componente. `AppProvider` já envolve toda a árvore em `main.tsx`.

### Pitfall 3: Formato do filtro de mês
**O que vai errado:** Backend usa `startswith(mes)` sobre datetime ISO — se passar `"04/2026"` ou `"Abril 2026"` o filtro retorna zero turnos.
**Como evitar:** `<input type="month">` retorna `"YYYY-MM"` nativamente — usar diretamente sem transformação.

### Pitfall 4: Permissão `IsGestorUPA` restringe por UPA? Não.
**Detalhe:** A view `relatorio_upa` verifica permissão `IsGestorUPA` mas **não verifica se `upa_id` pertence ao gestor logado** [VERIFIED: views.py:273]. Qualquer `gestor_upa` pode consultar qualquer UPA. Para TCC isso é aceitável — não introduzir lógica nova de autorização.

### Pitfall 5: 04-02 — fluxo do cidadão sem dados cadastrados
**O que vai errado:** Ao testar o portal cidadão, se não houver UPAs com `ativa=True` no município selecionado, a busca retorna lista vazia — parece bug mas é dado.
**Como evitar:** Verificar com dados de seed antes de reportar como bug.

---

## Plano 04-02: Escopo de Refinamentos

Os 5 perfis a validar são [VERIFIED: models.py + App.tsx]:

| Perfil | View principal | Fluxo crítico a testar |
|--------|---------------|------------------------|
| Cidadão | `CitizenPortal` | Buscar UPA → ver resultados → ver status em tempo real |
| Médico | `DoctorDashboard` | Login → ver turno → iniciar/pausar/encerrar |
| Gestor de UPA | `UPAManagerDashboard` | Login → ver médicos → navegar para `ReportsDashboard` |
| Gestor Municipal | `MunicipalManagerDashboard` | Login → ver stats → navegar para `reports` |
| Super Admin | `SuperAdminDashboard` | Login → cadastrar município → cadastrar gestor |

**Áreas de risco conhecidas** (candidatas a bugs):
- `alertasApi` foi removido de dashboards em commit `bc24ec4` — verificar se não sobrou referência morta em algum componente [VERIFIED: git log]
- `MOCK_MUNICIPALITIES` em `App.tsx` ainda usa logos de prefeituras externas via URL — podem quebrar por CORS/404
- Rota `'reports'` em `App.tsx` usa `onBack={() => setCurrentView('upa_manager_dashboard')}` — correto, mas verificar se gestor municipal também navega para `reports` e volta corretamente

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react |
| Config file | `vite.config.ts` (seção `test`) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de Teste | Comando | Arquivo Existe? |
|--------|--------------|---------------|---------|----------------|
| R4-reports | `ReportsDashboard` chama `relatoriosApi.upa()` no mount | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 |
| R4-month | Mudar mês re-chama `relatoriosApi.upa()` com novo mes | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 |
| R4-loading | `isLoading` inicial; dados visíveis após fetch | unit | `npm test -- --run ReportsDashboard` | ❌ Wave 0 |
| R4-5perfis | Todos os fluxos sem erro | manual/e2e | — | manual only |

### Wave 0 Gaps
- [ ] `src/tests/ReportsDashboard.test.tsx` — cobre R4-reports, R4-month, R4-loading
- [ ] Padrão: mock `relatoriosApi` + mock `useApp` (mesmo padrão de `UPAManagerDashboard.test.tsx`)

---

## Environment Availability

Step 2.6: SKIPPED — fase é puramente código/config, sem dependências externas novas. Django + React stack já verificado como funcionando (Fase 3 concluída com 10/10 testes UAT passando).

---

## Runtime State Inventory

Step 2.5: SKIPPED — fase não é rename/refactor/migration. Sem state runtime afetado.

---

## Open Questions

1. **Gráfico de barras no `ReportsDashboard` deve usar dados reais?**
   - O que sabemos: atualmente usa alturas hardcoded `[60, 75, 80, 65, 90, 85, 40, 55, 70, 85, 95, 75]`
   - O que está indefinido: R4 menciona "horas trabalhadas por especialidade" e "taxa de disponibilidade" mas não especifica gráfico
   - Recomendação: manter gráfico decorativo (12 barras animadas) sem dados reais — o valor está nas cards e na tabela. Implementar gráfico real introduziria complexidade desnecessária para TCC.

2. **`MunicipalManagerDashboard` deve exibir mais campos do payload municipal?**
   - O que sabemos: payload já retorna `total_upas`, `upas_ativas` mas o dashboard calcula esses valores a partir do array `upas`
   - Recomendação: não alterar — o dashboard já mostra esses valores corretamente a partir de `upas.length` e `upas.filter(u => u.ativa).length`. Consistência é mais valiosa que uma refatoração sem ganho visual.

---

## Assumptions Log

| # | Claim | Section | Risk se Errado |
|---|-------|---------|----------------|
| A1 | Gráfico de barras no `ReportsDashboard` pode permanecer decorativo sem dados reais | Open Questions | Requer implementação de mapeamento de dados por semana/dia — fora do escopo de R4 |
| A2 | `relatorio_upa` não valida posse da UPA pelo gestor — aceitável para TCC | Common Pitfalls | Vulnerabilidade de autorização; irrelevante para demonstração TCC |

---

## Sources

### Primary (HIGH confidence)
- `api/views.py:270-331` — implementação completa dos dois endpoints de relatório [VERIFIED: codebase]
- `src/services/api.ts:171-179` — `relatoriosApi` já implementado [VERIFIED: codebase]
- `src/components/ReportsDashboard.tsx` — componente com dados mock, sem API [VERIFIED: codebase]
- `src/components/MunicipalManagerDashboard.tsx` — já usa `relatoriosApi.municipio()` [VERIFIED: codebase]
- `src/components/UPAManagerDashboard.tsx` — padrão de useCallback+useEffect+polling [VERIFIED: codebase]
- `api/permissions.py` — `IsGestorUPA` e `IsGestorMunicipal` [VERIFIED: codebase]
- `src/store/AppContext.tsx` — `usuario.upa_id` e `usuario.municipio_id` disponíveis [VERIFIED: codebase]
- `.planning/phases/03-polling-em-tempo-real/03-UAT.md` — Fase 3 concluída 10/10 [VERIFIED: codebase]

---

## Metadata

**Confidence breakdown:**
- Contrato de API: HIGH — código verificado diretamente
- Padrão de integração: HIGH — copiado de componentes existentes no projeto
- Escopo 04-02: MEDIUM — bugs específicos só conhecidos após execução manual dos fluxos
- Gráfico decorativo: ASSUMED — decisão de escopo razoável, não documentada explicitamente

**Research date:** 2026-04-13
**Valid until:** entrega TCC (Junho 2026) — stack estável, sem upgrades planejados
