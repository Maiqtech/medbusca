from django.urls import path

from api.apps.relatorios.views import relatorio_municipio, relatorio_upa, relatorio_upa_medico

urlpatterns = [
    path("upa/<int:upa_id>/", relatorio_upa),
    path("upa/<int:upa_id>/medico/<int:medico_id>/", relatorio_upa_medico),
    path("municipio/<int:municipio_id>/", relatorio_municipio),
]
