from api.apps.usuarios.dtos import UsuarioDeactivateResponseDTO
from api.models import Usuario


def get_usuarios_queryset(request):
    user = request.user
    qs = Usuario.objects.filter(is_active=True).exclude(perfil="super_admin")
    if user.perfil == "gestor_municipal" and user.municipio_id:
        qs = qs.filter(municipio=user.municipio)
    elif user.perfil == "gestor_upa" and user.upa_id:
        qs = qs.filter(upa=user.upa)
    perfil = request.query_params.get("perfil")
    if perfil:
        qs = qs.filter(perfil=perfil)
    return qs


def deactivate_usuario(pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist as exc:
        raise LookupError("Usuário não encontrado.") from exc
    usuario.is_active = False
    usuario.email = f"__inativo_{usuario.pk}__{usuario.email}"
    usuario.save()
    return UsuarioDeactivateResponseDTO().to_dict()
