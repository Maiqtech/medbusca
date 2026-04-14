from api.models import Escala


def get_escalas_queryset(request):
    user = request.user
    qs = Escala.objects.select_related("medico", "medico__especialidade", "upa").all()
    if user.perfil == "gestor_upa":
        qs = qs.filter(upa=user.upa)
    elif user.perfil == "gestor_municipal":
        qs = qs.filter(upa__municipio=user.municipio)
    data = request.query_params.get("data")
    if data:
        qs = qs.filter(data=data)
    return qs
