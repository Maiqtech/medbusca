from django.utils import timezone
from django.utils.dateparse import parse_datetime

from api.apps.turnos.dtos import MeuTurnoDTO, TurnoHistoricoDTO
from api.models import RegistroTurno, Turno
from api.serializers import MedicoSerializer, TurnoSerializer


ACTIVE_TURNO_STATUSES = ["em_atendimento", "em_pausa"]


class TurnoPendenteAnteriorError(ValueError):
    def __init__(self, turno):
        self.turno = turno
        super().__init__("Existe um turno pendente de dia anterior. Encerre-o antes de iniciar um novo turno.")


def get_authenticated_medico(user, not_found_message="Medico nao encontrado."):
    try:
        return user.medico
    except Exception as exc:
        raise LookupError(not_found_message) from exc


def to_plain_data(value):
    if isinstance(value, list):
        return [to_plain_data(item) for item in value]
    if isinstance(value, dict):
        return {key: to_plain_data(item) for key, item in value.items()}
    return value


def format_turno_duration(turno):
    if not turno.encerrado_em:
        return None

    total_minutes = max(0, int((turno.encerrado_em - turno.iniciado_em).total_seconds() // 60))
    hours, minutes = divmod(total_minutes, 60)

    if hours and minutes:
        return f"{hours}h {minutes:02d}m"
    if hours:
        return f"{hours}h"
    return f"{minutes}m"


def serialize_turno_with_duration(turno):
    turno_data = to_plain_data(TurnoSerializer(turno).data)
    turno_data["duracao_formatada"] = format_turno_duration(turno)
    return turno_data


def build_historico_outros_dias(medico, limit=15):
    day_start = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
    turnos = (
        medico.turnos.filter(status="encerrado", iniciado_em__lt=day_start)
        .prefetch_related("registros")
        .order_by("-iniciado_em")
    )
    if limit is not None:
        turnos = turnos[:limit]

    historico = []
    for turno in turnos:
        historico.append(serialize_turno_with_duration(turno))

    return historico


def build_meu_turno_payload(user):
    medico = get_authenticated_medico(user, "Medico nao encontrado para este usuario.")
    turno = medico.turno_atual
    turno_pendente_anterior = medico.turno_pendente_anterior
    registros = turno.registros.all() if turno else []
    return MeuTurnoDTO(
        medico=to_plain_data(MedicoSerializer(medico).data),
        turno=to_plain_data(TurnoSerializer(turno).data) if turno else None,
        historico=[
            TurnoHistoricoDTO(acao=registro.acao, registrado_em=registro.registrado_em).to_dict()
            for registro in registros
        ],
        turno_pendente_anterior=to_plain_data(TurnoSerializer(turno_pendente_anterior).data)
        if turno_pendente_anterior
        else None,
        historico_outros_dias=build_historico_outros_dias(medico, limit=3),
    ).to_dict()


def build_meu_historico_payload(user):
    medico = get_authenticated_medico(user, "Medico nao encontrado para este usuario.")
    return {
        "medico": to_plain_data(MedicoSerializer(medico).data),
        "historico": build_historico_outros_dias(medico, limit=None),
    }


def iniciar_turno(user):
    medico = get_authenticated_medico(user)
    if medico.turno_pendente_anterior:
        raise TurnoPendenteAnteriorError(medico.turno_pendente_anterior)
    if medico.turno_atual:
        raise ValueError("Ja existe um turno em andamento.")
    turno = Turno.objects.create(medico=medico, status="em_atendimento")
    RegistroTurno.objects.create(turno=turno, acao="inicio")
    return turno


def pausar_turno(user):
    medico = get_authenticated_medico(user)
    turno_atual = medico.turno_atual
    turno = medico.turnos.filter(pk=getattr(turno_atual, "pk", None), status="em_atendimento").first()
    if not turno:
        raise ValueError("Nenhum turno ativo para pausar.")
    turno.status = "em_pausa"
    turno.save(update_fields=["status"])
    RegistroTurno.objects.create(turno=turno, acao="pausa")
    return turno


def retornar_turno(user):
    medico = get_authenticated_medico(user)
    turno_atual = medico.turno_atual
    turno = medico.turnos.filter(pk=getattr(turno_atual, "pk", None), status="em_pausa").first()
    if not turno:
        raise ValueError("Nenhum turno em pausa para retornar.")
    turno.status = "em_atendimento"
    turno.save(update_fields=["status"])
    RegistroTurno.objects.create(turno=turno, acao="retorno")
    return turno


def parse_encerrado_em(value):
    if not value:
        return None

    encerrado_em = parse_datetime(value)
    if encerrado_em is None:
        raise ValueError("Data/hora de encerramento invalida.")

    if timezone.is_naive(encerrado_em):
        encerrado_em = timezone.make_aware(encerrado_em, timezone.get_current_timezone())

    return encerrado_em


def get_turno_para_encerramento(medico, turno_id=None):
    if turno_id:
        return medico.turnos.filter(pk=turno_id, status__in=ACTIVE_TURNO_STATUSES).first()

    return medico.turno_atual or medico.turno_pendente_anterior or medico.turnos.filter(
        status__in=ACTIVE_TURNO_STATUSES
    ).first()


def validate_encerrado_em(turno, encerrado_em):
    if encerrado_em > timezone.now():
        raise ValueError("A data/hora de encerramento nao pode estar no futuro.")

    if encerrado_em <= turno.iniciado_em:
        raise ValueError("A data/hora de encerramento deve ser posterior ao inicio do turno.")

    ultimo_registro = turno.registros.order_by("-registrado_em").first()
    if ultimo_registro and encerrado_em <= ultimo_registro.registrado_em:
        raise ValueError("A data/hora de encerramento deve ser posterior ao ultimo registro do turno.")


def encerrar_turno(user, encerrado_em=None, turno_id=None):
    medico = get_authenticated_medico(user)
    turno = get_turno_para_encerramento(medico, turno_id)
    if not turno:
        raise ValueError("Nenhum turno ativo para encerrar.")

    encerrado_em_dt = parse_encerrado_em(encerrado_em) or timezone.now()
    validate_encerrado_em(turno, encerrado_em_dt)

    turno.status = "encerrado"
    turno.encerrado_em = encerrado_em_dt
    turno.save(update_fields=["status", "encerrado_em"])

    registro = RegistroTurno.objects.create(turno=turno, acao="encerramento")
    if encerrado_em:
        RegistroTurno.objects.filter(pk=registro.pk).update(registrado_em=encerrado_em_dt)

    return turno


def get_turnos_queryset(request):
    user = request.user
    qs = Turno.objects.select_related("medico", "medico__especialidade").prefetch_related("registros")
    if user.perfil == "gestor_upa":
        qs = qs.filter(medico__upa=user.upa)
    elif user.perfil == "gestor_municipal":
        qs = qs.filter(medico__upa__municipio=user.municipio)
    upa_id = request.query_params.get("upa_id")
    if upa_id:
        qs = qs.filter(medico__upa_id=upa_id)
    return qs
