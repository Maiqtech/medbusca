from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Alerta, Municipio, UPA, Usuario


def _get_or_create_alerta(tipo, mensagem, upa, municipio):
    alerta, created = Alerta.objects.get_or_create(
        tipo=tipo,
        mensagem=mensagem,
        upa=upa,
        municipio=municipio,
        resolvido=False,
    )
    return alerta, created


def _resolver_alertas(mensagem, upa=None, municipio=None):
    qs = Alerta.objects.filter(mensagem=mensagem, resolvido=False)
    if upa is not None:
        qs = qs.filter(upa=upa)
    if municipio is not None:
        qs = qs.filter(municipio=municipio)
    count = qs.count()
    qs.update(resolvido=True, resolvido_em=timezone.now())
    return count


def verificar_alertas_upa(upa):
    """Returns (created: bool, resolved: bool)."""
    tem_gestor = Usuario.objects.filter(
        perfil='gestor_upa', upa=upa, is_active=True
    ).exists()
    if not tem_gestor:
        _, created = _get_or_create_alerta(
            tipo='aviso',
            mensagem='UPA sem gestor responsável',
            upa=upa,
            municipio=upa.municipio,
        )
        return created, False
    else:
        resolved = _resolver_alertas('UPA sem gestor responsável', upa=upa)
        return False, resolved > 0


def verificar_alertas_municipio(municipio):
    """Returns (created: bool, resolved: bool)."""
    tem_gestor = Usuario.objects.filter(
        perfil='gestor_municipal', municipio=municipio, is_active=True
    ).exists()
    if not tem_gestor:
        _, created = _get_or_create_alerta(
            tipo='informativo',
            mensagem='Município sem gestor municipal',
            upa=None,
            municipio=municipio,
        )
        return created, False
    else:
        resolved = _resolver_alertas('Município sem gestor municipal', municipio=municipio)
        return False, resolved > 0


class Command(BaseCommand):
    help = 'Verifica condições estruturais e cria/resolve alertas automáticos.'

    def handle(self, *args, **options):
        criados = 0
        resolvidos = 0

        for upa in UPA.objects.filter(ativa=True).select_related('municipio'):
            created, resolved = verificar_alertas_upa(upa)
            if created:
                criados += 1
            if resolved:
                resolvidos += 1

        for municipio in Municipio.objects.filter(ativo=True):
            created, resolved = verificar_alertas_municipio(municipio)
            if created:
                criados += 1
            if resolved:
                resolvidos += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'verificar_alertas_estruturais: {criados} alertas criados, {resolvidos} resolvidos.'
            )
        )
