from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.apps.usuarios.services import deactivate_usuario, get_usuarios_queryset
from api.core.permissions import IsGestorMunicipal
from api.serializers import UsuarioCriarSerializer, UsuarioSerializer


class UsuarioListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UsuarioCriarSerializer
        return UsuarioSerializer

    def get_queryset(self):
        return get_usuarios_queryset(self.request)

    def create(self, request, *args, **kwargs):
        serializer = UsuarioCriarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        return Response(UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
@permission_classes([IsGestorMunicipal])
def desativar_usuario(request, pk):
    try:
        return Response(deactivate_usuario(pk))
    except LookupError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_404_NOT_FOUND)
