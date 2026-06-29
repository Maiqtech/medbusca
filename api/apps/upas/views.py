from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.apps.upas.services import (
    build_upa_disponibilidade_payload,
    get_upa_serializer_class,
    get_upas_queryset,
    serialize_upas_list,
)
from api.core.permissions import IsGestorMunicipal
from api.models import UPA
from api.serializers import UPASerializer


class UPAListCreate(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsGestorMunicipal()]

    def get_serializer_class(self):
        return get_upa_serializer_class(self.request)

    def get_queryset(self):
        return get_upas_queryset(self.request)

    def list(self, request, *args, **kwargs):
        return Response(serialize_upas_list(request, self.get_queryset()))

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class UPADetail(generics.RetrieveUpdateAPIView):
    queryset = UPA.objects.all()
    serializer_class = UPASerializer
    permission_classes = [IsGestorMunicipal]

    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


@api_view(["GET"])
@permission_classes([AllowAny])
def upa_disponibilidade(request, pk):
    try:
        return Response(build_upa_disponibilidade_payload(pk))
    except LookupError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)
