from django.urls import path

from api.apps.turnos.views import (
    encerrar_turno_view,
    iniciar_turno_view,
    listar_turnos,
    meu_historico_view,
    meu_turno,
    pausar_turno_view,
    retornar_turno_view,
)

urlpatterns = [
    path("", listar_turnos),
    path("meu/historico/", meu_historico_view),
    path("meu/", meu_turno),
    path("iniciar/", iniciar_turno_view),
    path("pausar/", pausar_turno_view),
    path("retornar/", retornar_turno_view),
    path("encerrar/", encerrar_turno_view),
]
