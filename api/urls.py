from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from . import views

urlpatterns = [
    # Health
    path('health/', views.health),

    # Auth
    path('auth/login/', views.MedBuscaTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('auth/me/', views.me),

    # Municípios
    path('municipios/', views.MunicipioListCreate.as_view()),
    path('municipios/<int:pk>/', views.MunicipioDetail.as_view()),

    # Especialidades
    path('especialidades/', views.EspecialidadeList.as_view()),

    # UPAs
    path('upas/', views.UPAListCreate.as_view()),
    path('upas/<int:pk>/', views.UPADetail.as_view()),

    # Médicos
    path('medicos/', views.MedicoListCreate.as_view()),
    path('medicos/<int:pk>/', views.MedicoDetail.as_view()),

    # Escalas
    path('escalas/', views.EscalaListCreate.as_view()),
    path('escalas/<int:pk>/', views.EscalaDelete.as_view()),

    # Turnos
    path('turnos/', views.listar_turnos),
    path('turnos/meu/', views.meu_turno),
    path('turnos/iniciar/', views.iniciar_turno),
    path('turnos/pausar/', views.pausar_turno),
    path('turnos/retornar/', views.retornar_turno),
    path('turnos/encerrar/', views.encerrar_turno),

    # Alertas
    path('alertas/', views.AlertaList.as_view()),
    path('alertas/<int:pk>/resolver/', views.resolver_alerta),

    # Relatórios
    path('relatorios/upa/<int:upa_id>/', views.relatorio_upa),
    path('relatorios/municipio/<int:municipio_id>/', views.relatorio_municipio),

    # Usuários
    path('usuarios/', views.UsuarioListCreate.as_view()),
    path('usuarios/<int:pk>/desativar/', views.desativar_usuario),

    # Ativação de conta
    path('ativar/<str:token>/', views.verificar_token_ativacao),
    path('ativar/', views.ativar_conta),

    # Recuperação de senha
    path('auth/esqueci-senha/', views.esqueci_senha),
    path('auth/redefinir-senha/', views.redefinir_senha),
]
