from datetime import datetime as dt

from django.utils import timezone

from api.apps.upas.dtos import UPAAvailabilityDTO, UPAEspecialidadeDisponibilidadeDTO
from api.models import Especialidade, UPA
from api.serializers import UPAPublicaSerializer, UPASerializer


def get_upa_serializer_class(request):
    if request.method == "POST":
        return UPASerializer
    especialidade_id = request.query_params.get("especialidade_id")
    municipio_id = request.query_params.get("municipio_id")
    if especialidade_id or municipio_id:
        return UPAPublicaSerializer
    return UPASerializer


def get_upas_queryset(request):
    qs = UPA.objects.filter(ativa=True).prefetch_related("especialidades", "medicos")
    municipio_id = request.query_params.get("municipio_id")
    especialidade_id = request.query_params.get("especialidade_id")
    if municipio_id:
        qs = qs.filter(municipio_id=municipio_id)
    if especialidade_id:
        qs = qs.filter(medicos__especialidade_id=especialidade_id).distinct()
    return qs


def get_upa_serializer_context(request):
    return {"request": request, "format": self_format(request), "view": None, "especialidade_id": request.query_params.get("especialidade_id")}


def self_format(request):
    return getattr(request, "accepted_renderer", None) and request.accepted_renderer.format


def serialize_upas_list(request, queryset):
    especialidade_id = request.query_params.get("especialidade_id")
    context = {"especialidade_id": especialidade_id}
    if especialidade_id:
        upas = [upa for upa in queryset if upa.medicos.filter(especialidade_id=especialidade_id).exists()]
        return UPAPublicaSerializer(upas, many=True, context=context).data
    serializer_class = get_upa_serializer_class(request)
    return serializer_class(queryset, many=True, context=context).data


def build_upa_disponibilidade_payload(pk):
    try:
        upa = UPA.objects.prefetch_related(
            "medicos__especialidade",
            "medicos__turnos",
            "medicos__escalas",
        ).get(pk=pk, ativa=True)
    except UPA.DoesNotExist as exc:
        raise LookupError("UPA não encontrada") from exc

    agora = timezone.now()
    especialidades = Especialidade.objects.filter(medicos__upa=upa).distinct().order_by("nome")

    resultado = []
    for especialidade in especialidades:
        medicos = upa.medicos.filter(especialidade=especialidade)

        disponivel = any(medico.turnos.filter(status="em_atendimento").exists() for medico in medicos)
        if disponivel:
            resultado.append(
                UPAEspecialidadeDisponibilidadeDTO(
                    especialidade_id=especialidade.id,
                    especialidade=especialidade.nome,
                    disponivel=True,
                    proximo_turno=None,
                ).to_dict()
            )
            continue

        proxima = None
        for medico in medicos:
            escala = medico.escalas.filter(data__gte=agora.date()).order_by("data", "hora_inicio").first()
            if escala and (proxima is None or (escala.data, escala.hora_inicio) < (proxima.data, proxima.hora_inicio)):
                proxima = escala

        proximo_str = None
        if proxima:
            dias_diff = (proxima.data - agora.date()).days
            hora_fmt = proxima.hora_inicio.strftime("%H:%M")
            if dias_diff == 0:
                hora_inicio = dt.combine(proxima.data, proxima.hora_inicio)
                if hora_inicio.replace(tzinfo=agora.tzinfo) > agora:
                    proximo_str = f"hoje às {hora_fmt}"
            elif dias_diff == 1:
                proximo_str = f"amanhã às {hora_fmt}"
            else:
                proximo_str = f"{proxima.data.strftime('%d/%m')} às {hora_fmt}"

        resultado.append(
            UPAEspecialidadeDisponibilidadeDTO(
                especialidade_id=especialidade.id,
                especialidade=especialidade.nome,
                disponivel=False,
                proximo_turno=proximo_str,
            ).to_dict()
        )

    return UPAAvailabilityDTO(
        id=upa.id,
        nome=upa.nome,
        bairro=upa.bairro,
        municipio_nome=upa.municipio.nome,
        especialidades=resultado,
    ).to_dict()
