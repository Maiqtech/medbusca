from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from api.apps.relatorios.services import (
    build_relatorio_municipio_payload,
    build_relatorio_upa_medico_payload,
    build_relatorio_upa_payload,
)
from api.core.permissions import IsGestorMunicipal, IsGestorUPA


@api_view(["GET"])
@permission_classes([IsGestorUPA])
def relatorio_upa(request, upa_id):
    try:
        return Response(build_relatorio_upa_payload(upa_id, request.query_params.get("mes")))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsGestorUPA])
def relatorio_upa_medico(request, upa_id, medico_id):
    try:
        return Response(build_relatorio_upa_medico_payload(upa_id, medico_id, request.query_params.get("mes")))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsGestorMunicipal])
def relatorio_municipio(request, municipio_id):
    try:
        return Response(build_relatorio_municipio_payload(municipio_id))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
