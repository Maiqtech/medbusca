from rest_framework import generics
from rest_framework.permissions import AllowAny

from api.apps.especialidades.services import list_especialidades_queryset
from api.serializers import EspecialidadeSerializer


class EspecialidadeList(generics.ListAPIView):
    serializer_class = EspecialidadeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return list_especialidades_queryset()
