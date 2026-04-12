# Requisitos — MedBusca (Fase Final)

## Escopo
Completar as funcionalidades faltantes para entrega do TCC. O sistema está ~80% implementado. Este milestone cobre o 20% restante.

## Funcionalidades a implementar

### R1 — Recuperação de senha (RF-005)
- Endpoint `POST /auth/esqueci-senha/` envia email com link de redefinição
- Endpoint `POST /auth/redefinir-senha/` valida token e atualiza senha
- Token com validade de 1 hora, uso único
- Frontend: link "Esqueci minha senha" na tela de login
- Frontend: tela de solicitação (campo email)
- Frontend: tela de nova senha (campos senha + confirmação)
- Email usa template consistente com o de ativação de conta

### R2 — Alertas automáticos (RF-026, RF-032, RF-037)
- Django signal ao encerrar turno: verificar se especialidade ficou sem cobertura → gerar alerta crítico para gestor de UPA
- Django signal ao iniciar turno: resolver automaticamente alertas de "especialidade sem médico"
- Cronjob/management command `verificar_turnos_nao_iniciados`: roda a cada hora, gera alertas para turnos previstos não iniciados no horário
- Alertas municipais: UPA sem gestor → alerta para gestor municipal
- Alertas globais: município sem gestor → alerta para super admin
- Alertas se auto-resolvem quando situação é corrigida

### R3 — Polling em tempo real (RNF-001)
- Portal do cidadão: polling a cada 10s para atualizar status das UPAs
- Dashboard do médico: polling a cada 15s para status do turno atual
- Dashboard gestor de UPA: polling a cada 15s para lista de médicos/status
- Indicador visual de "última atualização" nos dashboards
- Sem WebSocket — polling HTTP simples

### R4 — Relatórios conectados à API real (RF-031)
- `ReportsDashboard.tsx` conectar ao endpoint `/api/relatorios/upa/<id>/`
- Exibir: total de médicos, horas trabalhadas por especialidade, taxa de disponibilidade, frequência de alertas
- Filtro por mês funcional
- Gestor municipal: endpoint `/api/relatorios/municipio/<id>/` conectado ao frontend

## Não está no escopo
- WebSockets
- Notificações push (PWA push notifications)
- Geolocalização reversa (GPS real)
- Multi-idioma
- Integração com sistemas externos de saúde
- Relatórios em PDF/Excel

## Restrições
- Não remover nem quebrar nenhuma funcionalidade existente
- Manter compatibilidade com deploy em Render + Netlify
- Seguir padrões visuais existentes (Tailwind, componentes atuais)
- Backend: Python/Django apenas, sem dependências pesadas novas
