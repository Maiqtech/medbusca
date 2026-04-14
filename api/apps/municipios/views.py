from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.apps.municipios.services import deactivate_municipio, list_active_municipios_queryset
from api.core.permissions import IsSuperAdmin
from api.models import Municipio
from api.serializers import MunicipioSerializer


class MunicipioListCreate(generics.ListCreateAPIView):
    serializer_class = MunicipioSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get_queryset(self):
        return list_active_municipios_queryset()


class MunicipioDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Municipio.objects.all()
    serializer_class = MunicipioSerializer
    permission_classes = [IsSuperAdmin]

    def destroy(self, request, *args, **kwargs):
        municipio = self.get_object()
        return Response(deactivate_municipio(municipio))
