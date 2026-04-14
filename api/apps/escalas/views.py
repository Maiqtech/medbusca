from rest_framework import generics

from api.apps.escalas.services import get_escalas_queryset
from api.core.permissions import IsGestorUPA
from api.models import Escala
from api.serializers import EscalaSerializer


class EscalaListCreate(generics.ListCreateAPIView):
    serializer_class = EscalaSerializer
    permission_classes = [IsGestorUPA]

    def get_queryset(self):
        return get_escalas_queryset(self.request)


class EscalaDelete(generics.DestroyAPIView):
    queryset = Escala.objects.all()
    permission_classes = [IsGestorUPA]
