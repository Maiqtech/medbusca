from api.models import Especialidade


def list_especialidades_queryset():
    return Especialidade.objects.all()
