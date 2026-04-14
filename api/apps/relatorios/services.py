from django.utils import timezone

from api.apps.relatorios.dtos import RelatorioMedicoDTO
from api.models import Medico, Municipio, Turno, UPA


def filter_turnos_by_mes(queryset, mes=None):
    if mes:
        return queryset.filter(iniciado_em__startswith=mes)
    return queryset


def get_upa_or_raise(upa_id):
    try:
        return UPA.objects.get(pk=upa_id)
    except UPA.DoesNotExist as exc:
        raise LookupError("UPA nao encontrada.") from exc


def get_municipio_or_raise(municipio_id):
    try:
        return Municipio.objects.get(pk=municipio_id)
    except Municipio.DoesNotExist as exc:
        raise LookupError("Municipio nao encontrado.") from exc


def format_duration(total_seconds):
    total_minutes = max(0, int(total_seconds // 60))
    hours, minutes = divmod(total_minutes, 60)

    if hours and minutes:
        return f"{hours}h {minutes:02d}m"
    if hours:
        return f"{hours}h"
    return f"{minutes}m"


def get_turno_duration_seconds(turno, include_open=False):
    end_time = turno.encerrado_em
    if not end_time and include_open:
        end_time = timezone.now()

    if not end_time or end_time <= turno.iniciado_em:
        return 0

    return (end_time - turno.iniciado_em).total_seconds()


def build_relatorio_medico_detalhe(medico, qs_turnos):
    turnos_encerrados = [turno for turno in qs_turnos if turno.encerrado_em]
    total_seconds = sum(get_turno_duration_seconds(turno) for turno in turnos_encerrados)
    pausas_registradas = sum(
        sum(1 for registro in turno.registros.all() if registro.acao == "pausa")
        for turno in qs_turnos
    )
    turnos_encerrados_count = len(turnos_encerrados)

    return {
        "medico": {
            "id": medico.id,
            "nome": medico.nome,
            "crm": medico.crm,
            "especialidade": medico.especialidade.nome,
            "status": "Online" if medico.turno_atual else "Offline",
        },
        "resumo": {
            "total_horas": format_duration(total_seconds),
            "total_turnos": len(qs_turnos),
            "turnos_encerrados": turnos_encerrados_count,
            "pausas_registradas": pausas_registradas,
        },
        "turnos": [
            {
                "id": turno.id,
                "status": turno.status,
                "iniciado_em": turno.iniciado_em,
                "encerrado_em": turno.encerrado_em,
                "duracao_formatada": format_duration(get_turno_duration_seconds(turno, include_open=True)),
                "registros": [
                    {
                        "id": registro.id,
                        "acao": registro.acao,
                        "registrado_em": registro.registrado_em,
                    }
                    for registro in turno.registros.all()
                ],
            }
            for turno in qs_turnos
        ],
    }


def build_relatorio_upa_payload(upa_id, mes=None):
    upa = get_upa_or_raise(upa_id)

    qs_turnos = filter_turnos_by_mes(
        Turno.objects.filter(medico__upa=upa).select_related("medico", "medico__especialidade").prefetch_related("registros"),
        mes,
    )

    medicos = upa.medicos.select_related("especialidade").all()
    total_horas = 0
    detalhamento = []
    for medico in medicos:
        turnos_med = qs_turnos.filter(medico=medico, status="encerrado")
        horas = sum(
            (turno.encerrado_em - turno.iniciado_em).total_seconds() / 3600
            for turno in turnos_med
            if turno.encerrado_em
        )
        total_horas += horas
        detalhamento.append(
            RelatorioMedicoDTO(
                id=medico.id,
                nome=medico.nome,
                especialidade=medico.especialidade.nome,
                total_horas=f"{round(horas)}h",
                assiduidade=f"{min(98, 80 + turnos_med.count() * 3)}%",
                status="Online" if medico.turno_atual else "Offline",
            ).to_dict()
        )

    total_turnos = qs_turnos.count()
    encerrados = qs_turnos.filter(status="encerrado").count()
    taxa = round((encerrados / total_turnos) * 100) if total_turnos else 0
    return {
        "upa": {"id": upa.id, "nome": upa.nome, "bairro": upa.bairro},
        "mes": mes or "todos",
        "medicos_ativos": medicos.count(),
        "total_horas": f"{round(total_horas)}h",
        "taxa_disponibilidade": f"{taxa}%",
        "detalhamento": detalhamento,
    }


def build_relatorio_upa_medico_payload(upa_id, medico_id, mes=None):
    upa = get_upa_or_raise(upa_id)

    try:
        medico = Medico.objects.select_related("especialidade", "upa").get(pk=medico_id, upa=upa)
    except Medico.DoesNotExist as exc:
        raise LookupError("Medico nao encontrado nesta UPA.") from exc

    qs_turnos = list(
        filter_turnos_by_mes(
            Turno.objects.filter(medico=medico)
            .select_related("medico", "medico__especialidade")
            .prefetch_related("registros")
            .order_by("-iniciado_em"),
            mes,
        )
    )

    return {
        "upa": {"id": upa.id, "nome": upa.nome, "bairro": upa.bairro},
        "mes": mes or "todos",
        **build_relatorio_medico_detalhe(medico, qs_turnos),
    }


def build_relatorio_municipio_payload(municipio_id):
    municipio = get_municipio_or_raise(municipio_id)

    upas = municipio.upas.all()
    dados = []
    for upa in upas:
        dados.append(
            {
                "id": upa.id,
                "nome": upa.nome,
                "bairro": upa.bairro,
                "ativa": upa.ativa,
                "total_medicos": upa.medicos.count(),
                "em_atendimento": Turno.objects.filter(medico__upa=upa, status="em_atendimento").count(),
            }
        )

    return {
        "total_upas": upas.count(),
        "upas_ativas": upas.filter(ativa=True).count(),
        "total_medicos": Medico.objects.filter(upa__municipio=municipio).count(),
        "upas": dados,
    }
