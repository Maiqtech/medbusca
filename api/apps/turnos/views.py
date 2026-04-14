from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.apps.turnos.services import (
    build_meu_historico_payload,
    TurnoPendenteAnteriorError,
    build_meu_turno_payload,
    encerrar_turno,
    get_turnos_queryset,
    iniciar_turno,
    pausar_turno,
    retornar_turno,
)
from api.core.permissions import IsGestorUPA, IsMedico
from api.serializers import TurnoSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def meu_turno(request):
    try:
        return Response(build_meu_turno_payload(request.user))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsMedico])
def meu_historico_view(request):
    try:
        return Response(build_meu_historico_payload(request.user))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsMedico])
def iniciar_turno_view(request):
    try:
        return Response(TurnoSerializer(iniciar_turno(request.user)).data, status=status.HTTP_201_CREATED)
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except TurnoPendenteAnteriorError as exc:
        return Response(
            {
                "erro": str(exc),
                "codigo": "turno_pendente_anterior",
                "turno_pendente_anterior": TurnoSerializer(exc.turno).data,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsMedico])
def pausar_turno_view(request):
    try:
        return Response(TurnoSerializer(pausar_turno(request.user)).data)
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsMedico])
def retornar_turno_view(request):
    try:
        return Response(TurnoSerializer(retornar_turno(request.user)).data)
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsMedico])
def encerrar_turno_view(request):
    try:
        return Response(
            TurnoSerializer(
                encerrar_turno(
                    request.user,
                    encerrado_em=request.data.get("encerrado_em"),
                    turno_id=request.data.get("turno_id"),
                )
            ).data
        )
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsGestorUPA])
def listar_turnos(request):
    return Response(TurnoSerializer(get_turnos_queryset(request), many=True).data)
