from django.urls import path

from api.apps.contas import views

urlpatterns = [
    path("ativar/<str:token>/", views.verificar_token_ativacao),
    path("ativar/", views.ativar_conta),
    path("auth/esqueci-senha/", views.esqueci_senha),
    path("auth/redefinir-senha/", views.redefinir_senha),
]
