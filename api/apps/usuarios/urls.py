from django.urls import path

from api.apps.usuarios.views import UsuarioListCreate, desativar_usuario

urlpatterns = [
    path("", UsuarioListCreate.as_view()),
    path("<int:pk>/desativar/", desativar_usuario),
]
