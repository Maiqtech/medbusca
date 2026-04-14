from api.apps.relatorios.dtos import RelatorioMedicoDTO
from api.models import Medico, Municipio, Turno, UPA


def build_relatorio_upa_payload(upa_id, mes=None):
    try:
        upa = UPA.objects.get(pk=upa_id)
    except UPA.DoesNotExist as exc:
        raise LookupError("UPA não encontrada.") from exc

    qs_turnos = Turno.objects.filter(medico__upa=upa)
    if mes:
        qs_turnos = qs_turnos.filter(iniciado_em__startswith=mes)

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


def build_relatorio_municipio_payload(municipio_id):
    try:
        municipio = Municipio.objects.get(pk=municipio_id)
    except Municipio.DoesNotExist as exc:
        raise LookupError("Município não encontrado.") from exc

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
