from api.apps.auth.dtos import HealthDTO
from api.serializers import UsuarioSerializer


def build_health_payload():
    return HealthDTO(status="ok", sistema="MedBusca API Django", versao="2.0.0").to_dict()


def build_authenticated_user_payload(user):
    return UsuarioSerializer(user).data
