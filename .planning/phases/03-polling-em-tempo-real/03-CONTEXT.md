---
phase: 03-polling-em-tempo-real
gathered: 2026-04-13
status: Ready for planning
source: discuss-phase (partial — user skipped gray area discussion)
---

# Phase 03: Polling em Tempo Real — Context

<domain>
## Phase Boundary

Adicionar polling automático ao portal do cidadão (10s) e aos dashboards do médico e gestor de UPA (15s), com indicador de última atualização. Também adicionar botão de mapa no portal do cidadão que redireciona para Google Maps usando as coordenadas da UPA.

Sem WebSocket — polling HTTP simples via setInterval.

</domain>

<decisions>
## Implementation Decisions

### Mapa nas UPAs (LOCKED — usuário definiu)
- Exibir ícone/botão de mapa nos cards de UPA no portal do cidadão
- Ao clicar, redireciona para Google Maps com as coordenadas da UPA (`latitude`, `longitude`)
- Link abre em nova aba: `https://www.google.com/maps?q={latitude},{longitude}`
- Se UPA não tiver coordenadas: ocultar o botão (não mostrar ícone desabilitado)

### Polling — Frequência (LOCKED — definido em R3)
- Portal do cidadão: polling a cada 10 segundos
- Dashboard médico: polling a cada 15 segundos
- Dashboard gestor de UPA: polling a cada 15 segundos

### Tecnologia (LOCKED — definido em requisitos)
- Polling HTTP simples — sem WebSocket, sem SSE
- Usar `setInterval` + `useEffect` cleanup (padrão já usado no projeto)

### Claude's Discretion
- Formato do indicador de última atualização (timestamp ou "há Xs") — Claude decide
- Posição do indicador — Claude decide (discreto, não intrusivo)
- Comportamento de polling com aba em segundo plano — Claude decide (visibilitychange API recomendado para pausar)
- Atualização silenciosa vs feedback visual quando dados mudam — Claude decide (silencioso preferível para não distrair)

</decisions>

<canonical_refs>
## Canonical References

### Componentes a modificar
- `src/components/CitizenPortal.tsx` — Portal do cidadão (polling + botão mapa)
- `src/components/DoctorDashboard.tsx` — Dashboard médico (polling)
- `src/components/UPAManagerDashboard.tsx` — Dashboard gestor UPA (polling)

### Componentes existentes para referência
- `src/components/MapPicker.tsx` — Leaflet já instalado, padrão de uso de L (leaflet)
- `src/services/api.ts` — Funções de API existentes (upasApi, turnosApi)

### Modelo de dados
- `api/models.py` — UPA tem `latitude` e `longitude` (DecimalField, nullable)
- `api/serializers.py` — UPAPublicaSerializer (verificar se expõe lat/lng)

</canonical_refs>

<specifics>
## Specific Ideas

- Botão de mapa: ícone `Map` ou `Navigation` do lucide-react (já instalado no projeto)
- Link Google Maps: `https://www.google.com/maps?q={lat},{lng}` abre em `target="_blank"`
- Indicador de última atualização: texto discreto tipo "Atualizado às 14:32" ou "há 5s"

</specifics>

<deferred>
## Deferred Ideas

- Mapa embutido Leaflet no portal do cidadão mostrando todas as UPAs — pode ser fase futura
- Notificação visual quando status de UPA muda durante polling — fora do escopo desta fase

</deferred>

---
*Phase: 03-polling-em-tempo-real*
*Context gathered: 2026-04-13 via discuss-phase*
