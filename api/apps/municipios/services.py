from api.apps.municipios.dtos import MunicipioDeactivateResponseDTO
from api.models import Municipio


def list_active_municipios_queryset():
    return Municipio.objects.filter(ativo=True)


def deactivate_municipio(municipio):
    municipio.ativo = False
    municipio.save()
    return MunicipioDeactivateResponseDTO().to_dict()
