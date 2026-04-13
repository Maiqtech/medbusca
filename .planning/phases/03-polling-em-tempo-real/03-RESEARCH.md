# Phase 03: Polling em Tempo Real — Research

**Researched:** 2026-04-12
**Domain:** React polling patterns, setInterval/useEffect, Page Visibility API, UPAPublicaSerializer lat/lng
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Polling technology:** setInterval + useEffect cleanup — sem WebSocket, sem SSE
- **CitizenPortal:** polling a cada 10 segundos
- **DoctorDashboard:** polling a cada 15 segundos
- **UPAManagerDashboard:** polling a cada 15 segundos
- **Google Maps button:** abre `https://www.google.com/maps?q={latitude},{longitude}` em nova aba
- **Coordenadas ausentes:** ocultar botão completamente (não mostrar desabilitado)
- **UPAPublicaSerializer:** deve expor `latitude` e `longitude`

### Claude's Discretion

- Formato do indicador de última atualização ("Atualizado às HH:MM" ou "há Xs")
- Posição do indicador (discreto, não intrusivo)
- Comportamento com aba em segundo plano (visibilitychange API recomendado para pausar)
- Atualização silenciosa vs feedback visual (silencioso preferível)

### Deferred Ideas (OUT OF SCOPE)

- Mapa embutido Leaflet no portal mostrando todas as UPAs
- Notificação visual quando status de UPA muda durante polling
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R3 | Portal do cidadão: polling 10s para status das UPAs | useEffect + setInterval pattern documentado abaixo |
| R3 | Dashboard médico: polling 15s para status do turno | turnosApi.meu() já existe — reusar no intervalo |
| R3 | Dashboard gestor UPA: polling 15s para médicos/status | medicosApi.listar() + turnosApi.listar() já existem |
| R3 | Indicador visual de última atualização nos dashboards | Date().toLocaleTimeString('pt-BR') pattern já usado no projeto |
| R3 | Sem WebSocket — polling HTTP simples | Confirmado — apenas fetch via apiFetch |
</phase_requirements>

---

## Summary

Esta fase é puramente frontend (3 componentes React) com uma pequena mudança de backend (serializer). Não há novas rotas de API, nenhum novo modelo, nenhuma nova dependência.

O projeto já usa `setInterval` com `clearInterval` em `DoctorDashboard.tsx` (linha 65–68) para o relógio de 60s. O padrão exato para polling de dados é o mesmo — wrapping a chamada de API dentro de um `setInterval`, com `clearInterval` no cleanup do `useEffect`. A implementação é mecânica e de baixo risco.

A única mudança de backend é adicionar `'latitude'` e `'longitude'` à lista `fields` de `UPAPublicaSerializer`. Ambos os campos já existem no modelo UPA (`DecimalField, null=True, blank=True`) — basta expô-los no serializer.

**Primary recommendation:** Implementar polling como wrapper sobre as chamadas de API existentes. Não criar novos hooks customizados — o padrão inline com `useEffect`/`setInterval` é suficiente e consistente com o código atual.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (useState, useEffect) | 19 (já instalado) | Polling state e side effects | Nativo do projeto |
| Browser `setInterval` / `clearInterval` | N/A (Web API) | Temporizador periódico | Padrão da plataforma — sem dependência |
| Page Visibility API (`document.visibilitychange`) | N/A (Web API) | Pausar polling com aba oculta | Padrão da plataforma — evita requisições desnecessárias |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react (`Map` icon) | já instalado | Ícone do botão Google Maps | Já usado no projeto — manter consistência |
| `Date.toLocaleTimeString('pt-BR')` | N/A | Formatar hora da última atualização | Já usado em DoctorDashboard linha 38 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| setInterval inline | Custom hook `usePolling` | Hook é mais reusável mas adiciona complexidade desnecessária para 3 usos |
| `setInterval` | `react-query` com `refetchInterval` | react-query não está no projeto — introduziria dependência pesada |
| Page Visibility API manual | sem pausa em segundo plano | Sem pausa: desperdício de banda, requisições desnecessárias em produção |

**Installation:** Nenhuma instalação necessária — todas as ferramentas já estão disponíveis.

---

## Architecture Patterns

### Padrão de Polling (baseado no código existente do projeto)

O projeto já usa o padrão em `DoctorDashboard.tsx` para o timer do relógio. O polling de dados segue exatamente o mesmo shape: [VERIFIED: leitura de DoctorDashboard.tsx linha 64-68]

```typescript
// Source: DoctorDashboard.tsx (linhas 64-68) — padrão já no projeto
const timer = setInterval(() => {
  setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
}, 60000);
return () => clearInterval(timer);
```

### Padrão Completo para Polling de Dados (extensão do padrão existente)

```typescript
// [ASSUMED] — padrão React canônico, consistente com o que já está no projeto
const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

const fetchDados = useCallback(async () => {
  try {
    const dados = await algumaApi.listar(params);
    setDados(dados);
    setUltimaAtualizacao(new Date());
  } catch {
    // silencioso — não resetar dados existentes em falha de polling
  }
}, [/* deps */]);

useEffect(() => {
  fetchDados(); // busca imediata
  const intervalo = setInterval(fetchDados, 10_000); // ou 15_000
  return () => clearInterval(intervalo);
}, [fetchDados]);
```

### Pausa com Page Visibility API

```typescript
// [ASSUMED] — Web API padrão, amplamente suportada
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      fetchDados(); // busca imediata ao voltar
      intervaloRef.current = setInterval(fetchDados, INTERVAL_MS);
    } else {
      clearInterval(intervaloRef.current);
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [fetchDados]);
```

Nota: Para simplicidade TCC, a implementação pode omitir a pausa de visibilidade e usar apenas o setInterval direto. A decisão fica a cargo do planejador conforme o CONTEXT.md marca como "Claude's Discretion".

### Indicador de Última Atualização

```typescript
// Formato recomendado: "Atualizado às 14:32" — consistente com idioma pt-BR do projeto
const formatarHora = (d: Date) =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
// Exibição: texto xs, discreto, abaixo do título da seção
// Exemplo: <p className="text-[10px] text-slate-400 font-bold">Atualizado às {formatarHora(ultimaAtualizacao)}</p>
```

### Botão Google Maps nos Cards de UPA

```typescript
// Source: CONTEXT.md (decisão locked)
// Ícone: Map do lucide-react (já importado em outros componentes)
{(upa.latitude && upa.longitude) && (
  <a
    href={`https://www.google.com/maps?q=${upa.latitude},${upa.longitude}`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    <Map size={14} />
  </a>
)}
```

### Anti-Patterns to Avoid

- **Resetar `results` para null durante re-fetch de polling:** Causaria flash de UI a cada 10s. Não chamar `setResults(null)` no início de cada poll — só no `handleSearch` manual.
- **Chamar `setIsSearching(true)` durante polling:** O spinner de busca não deve aparecer em polls silenciosos. O polling é invisível para o usuário.
- **Iniciar polling antes da primeira busca manual:** O CitizenPortal só deve iniciar polling DEPOIS que `results !== null` (ou seja, depois que o usuário fez a primeira busca). Senão, pollaríamos sem parâmetros.
- **Depender de `results` como dep do useEffect de polling:** Causaria re-criação do intervalo a cada dado recebido. Usar `useCallback` ou refs para parâmetros.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polling periódico | Implementação própria com Promises encadeadas | `setInterval` + `useEffect` cleanup | Padrão do projeto, simples, sem deps |
| Formatação de hora | Parser manual | `Date.toLocaleTimeString('pt-BR', ...)` | Já usado no projeto (DoctorDashboard linha 38) |
| Link para mapa externo | Embed de mapa | `<a href="https://www.google.com/maps?q=...">` | Decisão locked — Google Maps externo |
| Detecção de coordenadas nulas | Lógica complexa | `upa.latitude && upa.longitude` | Boolean check simples, DecimalField é null quando não preenchido |

---

## Backend: UPAPublicaSerializer — Mudança Necessária

**Status atual** [VERIFIED: leitura de serializers.py linha 163]:

```python
class Meta:
    model = UPA
    fields = ['id', 'nome', 'bairro', 'municipio_nome', 'especialidades', 'status_especialidade']
    # latitude e longitude AUSENTES
```

**Mudança necessária** — adicionar `'latitude'` e `'longitude'`:

```python
class Meta:
    model = UPA
    fields = ['id', 'nome', 'bairro', 'municipio_nome', 'especialidades',
              'status_especialidade', 'latitude', 'longitude']
```

**Por que é seguro** [VERIFIED: leitura de models.py linha 84-85]:
- `UPA.latitude` e `UPA.longitude` são `DecimalField(null=True, blank=True)` — retornam `null` no JSON quando não preenchidos.
- `UPAPublicaSerializer` é o serializer do portal público — expor lat/lng não é dado sensível.
- Nenhuma migração de banco necessária — campos já existem.
- `UPASerializer` (serializer admin) já expõe `latitude` e `longitude` na linha 125 [VERIFIED].

**Impacto no frontend** — o tipo do dado será `string | null` (DRF serializa DecimalField como string). No CitizenPortal, `upa.latitude` virá como `"12.345678"` ou `null`. O check `upa.latitude && upa.longitude` funciona corretamente pois string não-vazia é truthy.

---

## Common Pitfalls

### Pitfall 1: Polling inicia antes da busca manual no CitizenPortal

**What goes wrong:** O `useEffect` de polling roda ao montar o componente, mas `results` é `null` e os parâmetros (`selectedMunicipio`, `selectedEspecialidade`) ainda não estão definidos. Polling chamaria a API sem filtros ou retornaria erro silencioso.

**Why it happens:** CitizenPortal é search-first (o usuário precisa escolher município e especialidade). O polling só faz sentido depois da primeira busca bem-sucedida.

**How to avoid:** Condicionar o `useEffect` de polling a `results !== null`. O intervalo só é criado quando `results` não é nulo.

```typescript
useEffect(() => {
  if (!results) return; // não pollar antes da primeira busca
  const intervalo = setInterval(refetchUPAs, 10_000);
  return () => clearInterval(intervalo);
}, [results !== null, selectedMunicipio?.id, selectedEspecialidade?.id]);
```

**Warning signs:** "Polling ativo mas resultados não apareceram" — indica que o intervalo foi criado sem parâmetros.

### Pitfall 2: Flash de UI a cada ciclo de polling

**What goes wrong:** Chamar `setResults(null)` ou `setIsSearching(true)` dentro da função de polling faz a lista desaparecer por um frame e o spinner aparecer a cada 10 segundos.

**Why it happens:** Reusar `handleSearch` literalmente para polling — mas `handleSearch` reseta estado de carregamento visível.

**How to avoid:** Criar função separada `refetchSilencioso` que atualiza `results` diretamente sem mexer em `isSearching` ou `results → null`.

### Pitfall 3: Memory leak por clearInterval não chamado

**What goes wrong:** Componente desmonta mas o intervalo continua rodando. Próxima chamada ao `setState` em componente desmontado gera warning React.

**Why it happens:** `return () => clearInterval(id)` omitido ou escrito fora do `useEffect`.

**How to avoid:** Sempre retornar o cleanup dentro do `useEffect`. Padrão já correto em DoctorDashboard linha 68 [VERIFIED].

### Pitfall 4: Deps incorretas no useEffect de polling

**What goes wrong:** Se `selectedMunicipio` ou `selectedEspecialidade` mudam (usuário troca filtro) mas o `useEffect` não recria o intervalo, o polling continuará buscando os dados dos filtros antigos.

**How to avoid:** Incluir `selectedMunicipio?.id` e `selectedEspecialidade?.id` no array de dependências. O intervalo será recriado automaticamente ao mudar filtros.

---

## Code Examples

### DoctorDashboard — Polling de turno (15s)

```typescript
// Substituir o useEffect inicial de DoctorDashboard para incluir polling
// [ASSUMED] — extensão natural do padrão existente

const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

const fetchTurno = useCallback(async () => {
  try {
    const data = await turnosApi.meu();
    setMedico(data.medico);
    if (data.turno) setStatus(API_STATUS[data.turno.status] || 'not_started');
    if (data.historico) setHistory(/* mapear */);
    setUltimaAtualizacao(new Date());
  } catch {}
}, []);

useEffect(() => {
  fetchTurno();
  const timer = setInterval(fetchTurno, 15_000);
  return () => clearInterval(timer);
}, [fetchTurno]);
```

### UPAManagerDashboard — Polling de médicos (15s)

```typescript
// [ASSUMED] — extensão do useEffect existente

const fetchDados = useCallback(async () => {
  const upaId = usuario?.upa_id;
  try {
    const [m, a, t] = await Promise.all([
      medicosApi.listar(upaId ? { upa_id: upaId } : {}),
      alertasApi.listar(),
      turnosApi.listar(upaId ? { upa_id: upaId } : {}),
    ]);
    setMedicos(m); setAlertas(a); setTurnos(t);
    setUltimaAtualizacao(new Date());
  } catch {}
}, [usuario?.upa_id]);

useEffect(() => {
  fetchDados();
  setIsLoading(false); // apenas no primeiro carregamento
  const intervalo = setInterval(fetchDados, 15_000);
  return () => clearInterval(intervalo);
}, [fetchDados]);
```

### CitizenPortal — Polling condicional (10s)

```typescript
// [ASSUMED] — pattern necessário para CitizenPortal

const refetchUPAs = useCallback(async () => {
  if (!selectedEspecialidade || !selectedMunicipio) return;
  try {
    const upas = await upasApi.listar({
      municipio_id: selectedMunicipio.id,
      especialidade_id: selectedEspecialidade.id,
    });
    setResults(upas);
    setUltimaAtualizacao(new Date());
  } catch {} // silencioso — não mostrar erro em re-fetch automático
}, [selectedMunicipio?.id, selectedEspecialidade?.id]);

useEffect(() => {
  if (!results) return; // só pollar depois da primeira busca manual
  const intervalo = setInterval(refetchUPAs, 10_000);
  return () => clearInterval(intervalo);
}, [!!results, refetchUPAs]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSockets para dados em tempo real | Polling HTTP com setInterval (R3 decision) | Decisão de projeto | Mais simples, sem infra adicional |
| react-query refetchInterval | setInterval manual | N/A — react-query nunca foi adotado | Manter consistência com projeto existente |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useCallback` necessário para estabilizar `fetchDados` nas deps do `useEffect` | Architecture Patterns | Se não usado, useEffect re-registra intervalo em todo render — comportamento incorreto mas não crash |
| A2 | DRF serializa `DecimalField` como string no JSON | Backend section | Se retornar float, o check `upa.latitude && upa.longitude` ainda funciona — risco baixo |
| A3 | Pausa com `visibilitychange` é "Claude's Discretion" — pode ser omitida para simplificar | Architecture Patterns | Sem pausa: requisições extras quando aba está oculta. Impacto mínimo para TCC |
| A4 | `results !== null` como condição de polling é suficiente — não precisa de flag separada | Code Examples | Funciona corretamente: results é null antes da busca, array depois |

---

## Open Questions

1. **isLoading no UPAManagerDashboard durante polling**
   - What we know: `isLoading` é setado para `false` no `.finally()` do `Promise.all` inicial
   - What's unclear: com polling, não queremos mostrar loading spinner a cada 15s
   - Recommendation: Usar `isLoading` apenas para o primeiro carregamento; polling posterior é silencioso. Separar `isLoading` do estado de polling com flag `isFirstLoad`.

2. **Indicador de atualização no CitizenPortal vs Dashboards**
   - What we know: CONTEXT.md menciona indicador "nos dashboards" — CitizenPortal não está explicitamente incluído
   - What's unclear: R3 não menciona indicador no CitizenPortal
   - Recommendation: Adicionar indicador apenas nos dois dashboards (DoctorDashboard, UPAManagerDashboard). CitizenPortal: omitir ou adicionar texto discreto junto ao contador de resultados.

---

## Environment Availability

Step 2.6: SKIPPED — fase é puramente frontend + uma linha de serializer. Sem dependências externas novas.

---

## Validation Architecture

Workflow `nyquist_validation` não está definido em config.json — tratado como habilitado.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (stack do projeto: React 19 + Vite) |
| Config file | Verificar `vitest.config.ts` ou `vite.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R3 | setInterval criado ao montar componente com results | unit | `npx vitest run src/components/CitizenPortal.test.tsx` | Wave 0 |
| R3 | clearInterval chamado ao desmontar | unit | `npx vitest run src/components/CitizenPortal.test.tsx` | Wave 0 |
| R3 | Polling não inicia antes da primeira busca | unit | `npx vitest run src/components/CitizenPortal.test.tsx` | Wave 0 |
| R3 | DoctorDashboard polling 15s | unit | `npx vitest run src/components/DoctorDashboard.test.tsx` | Wave 0 |
| R3 | UPAManagerDashboard polling 15s | unit | `npx vitest run src/components/UPAManagerDashboard.test.tsx` | Wave 0 |
| R3 | Botão Google Maps renderizado quando lat/lng presentes | unit | incluso nos testes acima | Wave 0 |
| R3 | Botão Google Maps ausente quando lat/lng são null | unit | incluso nos testes acima | Wave 0 |
| R3 | UPAPublicaSerializer expõe latitude e longitude | manual/integration | `python manage.py shell -c "..."` | N/A |

### Wave 0 Gaps

- [ ] `src/components/CitizenPortal.test.tsx` — polling condicional, botão mapa
- [ ] `src/components/DoctorDashboard.test.tsx` — polling 15s, indicador atualização
- [ ] `src/components/UPAManagerDashboard.test.tsx` — polling 15s, indicador atualização

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não | — |
| V3 Session Management | não | — |
| V4 Access Control | não | Polling usa os mesmos endpoints autenticados já existentes |
| V5 Input Validation | não | Polling não aceita input do usuário |
| V6 Cryptography | não | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Polling agressivo (DoS acidental) | Availability | Intervalos de 10s/15s são conservadores — sem risco |
| Link Google Maps target="_blank" sem rel | Spoofing | Usar `rel="noopener noreferrer"` (padrão para links externos) |

---

## Sources

### Primary (HIGH confidence)
- `src/components/DoctorDashboard.tsx` — padrão setInterval/clearInterval já em uso no projeto
- `src/components/CitizenPortal.tsx` — estrutura de estado e handleSearch
- `api/serializers.py` — UPAPublicaSerializer fields list atual
- `api/models.py` — UPA.latitude e UPA.longitude (DecimalField, null=True, blank=True)
- `src/services/api.ts` — funções upasApi, turnosApi, medicosApi disponíveis

### Secondary (MEDIUM confidence)
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — suporte universal em browsers modernos [ASSUMED via training knowledge]

### Tertiary (LOW confidence)
- Nenhum

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — padrões verificados no código existente do projeto
- Backend change: HIGH — campos verificados no modelo e serializer via leitura direta
- Architecture: HIGH para setInterval pattern (verificado no código); MEDIUM para Page Visibility (padrão amplamente conhecido, não verificado via tool nesta sessão)
- Pitfalls: HIGH — derivados de análise do código existente e interações previsíveis

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stack estável, sem dependências de terceiros novas)
