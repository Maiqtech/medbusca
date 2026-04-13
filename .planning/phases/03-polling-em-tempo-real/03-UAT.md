---
status: complete
phase: 03-polling-em-tempo-real
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-04-13T10:45:00Z
updated: 2026-04-13T14:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CitizenPortal — sem polling antes da busca
expected: Abra o portal do cidadão sem fazer busca. No DevTools → Network, não deve aparecer nenhuma requisição periódica para /api/upas/. O intervalo só começa após a primeira busca.
result: pass

### 2. CitizenPortal — polling inicia após busca
expected: Selecione município + especialidade e clique em Buscar. Após ver os resultados, observe o DevTools → Network. Requisições para /api/upas/ devem aparecer automaticamente a cada ~10s sem nenhuma ação do usuário.
result: pass

### 3. CitizenPortal — botão Google Maps em cards com coordenadas
expected: Nos cards de UPA que possuem latitude/longitude cadastrados, deve aparecer um ícone de navegação (Navigation) com o texto "Mapa". Ao clicar, abre o Google Maps em nova aba no endereço correto da UPA.
result: pass

### 4. CitizenPortal — sem botão de mapa em cards sem coordenadas
expected: Cards de UPA sem latitude/longitude não exibem nenhum botão de mapa. O card aparece normalmente mas sem o ícone Navigation.
result: pass

### 5. CitizenPortal — indicador "Atualizado às"
expected: Após a primeira busca (ou após um ciclo de poll), aparece um texto pequeno "Atualizado às HH:MM" abaixo do cabeçalho de resultados. O horário deve atualizar a cada novo poll.
result: pass

### 6. DoctorDashboard — polling 15s
expected: Faça login como médico. No DevTools → Network, a requisição para /api/turnos/meu/ deve aparecer automaticamente a cada ~15s. Não deve exibir spinner durante esses re-fetches automáticos.
result: pass

### 7. DoctorDashboard — indicador "Atualizado às"
expected: Na tela do médico, deve aparecer um texto pequeno "Atualizado às HH:MM" alinhado à direita, ao lado do título "Meu Turno". O horário deve corresponder à última atualização dos dados.
result: pass

### 8. UPAManagerDashboard — polling 15s
expected: Faça login como gestor de UPA. No DevTools → Network, as requisições para /api/medicos/ e /api/turnos/ devem aparecer a cada ~15s automaticamente, sem spinner.
result: pass

### 9. UPAManagerDashboard — indicador "Atualizado às"
expected: Na tela do gestor, deve aparecer "Atualizado às HH:MM" alinhado à direita ao lado do título "Painel da UPA".
result: pass

### 10. Polling silencioso — dados permanecem visíveis
expected: Durante um ciclo de poll automático (em qualquer dashboard), os dados já carregados continuam visíveis. Nenhum spinner de carregamento aparece. Os dados só mudam se o servidor retornar novos valores.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
