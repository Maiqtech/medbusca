from .auth import MedBuscaTokenObtainPairSerializer
from .escalas import EscalaSerializer
from .especialidades import EspecialidadeSerializer
from .medicos import MedicoCriarSerializer, MedicoSerializer
from .municipios import MunicipioSerializer
from .turnos import RegistroTurnoSerializer, TurnoSerializer
from .upas import UPAPublicaSerializer, UPASerializer
from .usuarios import UsuarioCriarSerializer, UsuarioSerializer

__all__ = [
    "EscalaSerializer",
    "EspecialidadeSerializer",
    "MedBuscaTokenObtainPairSerializer",
    "MedicoCriarSerializer",
    "MedicoSerializer",
    "MunicipioSerializer",
    "RegistroTurnoSerializer",
    "TurnoSerializer",
    "UPAPublicaSerializer",
    "UPASerializer",
    "UsuarioCriarSerializer",
    "UsuarioSerializer",
]
