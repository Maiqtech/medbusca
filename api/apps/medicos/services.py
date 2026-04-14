from api.models import Medico


def get_medicos_queryset(request):
    user = request.user
    qs = Medico.objects.select_related("especialidade", "upa").all()
    if user.perfil == "gestor_upa":
        qs = qs.filter(upa=user.upa)
    elif user.perfil == "gestor_municipal":
        qs = qs.filter(upa__municipio=user.municipio)
    upa_id = request.query_params.get("upa_id")
    if upa_id:
        qs = qs.filter(upa_id=upa_id)
    return qs
