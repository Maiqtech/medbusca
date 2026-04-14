from django.urls import include, path

urlpatterns = [
    path("", include("api.apps.auth.urls")),
    path("", include("api.apps.contas.urls")),
    path("municipios/", include("api.apps.municipios.urls")),
    path("especialidades/", include("api.apps.especialidades.urls")),
    path("upas/", include("api.apps.upas.urls")),
    path("medicos/", include("api.apps.medicos.urls")),
    path("escalas/", include("api.apps.escalas.urls")),
    path("turnos/", include("api.apps.turnos.urls")),
    path("relatorios/", include("api.apps.relatorios.urls")),
    path("usuarios/", include("api.apps.usuarios.urls")),
]
