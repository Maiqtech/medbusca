from django.urls import path

from api.apps.relatorios.views import relatorio_municipio, relatorio_upa

urlpatterns = [
    path("upa/<int:upa_id>/", relatorio_upa),
    path("municipio/<int:municipio_id>/", relatorio_municipio),
]
