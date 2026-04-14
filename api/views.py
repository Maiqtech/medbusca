from api.apps.auth.views import MedBuscaTokenObtainPairView, health, me
from api.apps.contas.views import ativar_conta, esqueci_senha, redefinir_senha, verificar_token_ativacao
from api.apps.escalas.views import EscalaDelete, EscalaListCreate
from api.apps.especialidades.views import EspecialidadeList
from api.apps.medicos.views import MedicoDetail, MedicoListCreate
from api.apps.municipios.views import MunicipioDetail, MunicipioListCreate
from api.apps.relatorios.views import relatorio_municipio, relatorio_upa
from api.apps.turnos.views import (
    encerrar_turno_view as encerrar_turno,
    iniciar_turno_view as iniciar_turno,
    listar_turnos,
    meu_turno,
    pausar_turno_view as pausar_turno,
    retornar_turno_view as retornar_turno,
)
from api.apps.upas.views import UPADetail, UPAListCreate, upa_disponibilidade
from api.apps.usuarios.views import UsuarioListCreate, desativar_usuario

__all__ = [
    "EscalaDelete",
    "EscalaListCreate",
    "EspecialidadeList",
    "MedBuscaTokenObtainPairView",
    "MedicoDetail",
    "MedicoListCreate",
    "MunicipioDetail",
    "MunicipioListCreate",
    "UPADetail",
    "UPAListCreate",
    "UsuarioListCreate",
    "ativar_conta",
    "desativar_usuario",
    "encerrar_turno",
    "esqueci_senha",
    "health",
    "iniciar_turno",
    "listar_turnos",
    "me",
    "meu_turno",
    "pausar_turno",
    "redefinir_senha",
    "relatorio_municipio",
    "relatorio_upa",
    "retornar_turno",
    "upa_disponibilidade",
    "verificar_token_ativacao",
]
