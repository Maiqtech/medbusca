from rest_framework import generics, status
from rest_framework.response import Response

from api.apps.medicos.services import get_medicos_queryset
from api.core.permissions import IsGestorUPA
from api.models import Medico
from api.serializers import MedicoCriarSerializer, MedicoSerializer


class MedicoListCreate(generics.ListCreateAPIView):
    permission_classes = [IsGestorUPA]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MedicoCriarSerializer
        return MedicoSerializer

    def get_queryset(self):
        return get_medicos_queryset(self.request)

    def create(self, request, *args, **kwargs):
        serializer = MedicoCriarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        medico = serializer.save()
        return Response(MedicoSerializer(medico).data, status=status.HTTP_201_CREATED)


class MedicoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medico.objects.all()
    serializer_class = MedicoSerializer
    permission_classes = [IsGestorUPA]
