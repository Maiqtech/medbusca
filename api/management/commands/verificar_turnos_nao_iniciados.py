from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Alerta, Escala, Turno


class Command(BaseCommand):
    help = 'Cria alertas de aviso para turnos escalados que não foram iniciados'

    def handle(self, *args, **kwargs):
        agora = timezone.localtime(timezone.now())
        hoje = agora.date()
        hora_atual = agora.time()

        # Escalas de hoje cujo horário de início já passou
        escalas_atrasadas = Escala.objects.filter(
            data=hoje,
            hora_inicio__lt=hora_atual,
        ).select_related('medico', 'upa', 'upa__municipio')

        criados = 0
        pulados = 0

        hoje_inicio = agora.replace(hour=0, minute=0, second=0, microsecond=0)
        hoje_fim = hoje_inicio + timedelta(days=1)

        for escala in escalas_atrasadas:
            # Check whether medico has ANY turno started today (timezone-safe range)
            turno_existe = Turno.objects.filter(
                medico=escala.medico,
                iniciado_em__gte=hoje_inicio,
                iniciado_em__lt=hoje_fim,
            ).exists()

            if turno_existe:
                pulados += 1
                continue

            mensagem = (
                f'Médico {escala.medico.nome} não iniciou o turno '
                f'previsto para {escala.hora_inicio.strftime("%H:%M")} '
                f'na UPA {escala.upa.nome}.'
            )

            # Dedup: skip if an unresolved aviso with this same message already exists
            ja_existe = Alerta.objects.filter(
                tipo='aviso',
                upa=escala.upa,
                mensagem=mensagem,
                resolvido=False,
            ).exists()

            if ja_existe:
                pulados += 1
                continue

            Alerta.objects.create(
                tipo='aviso',
                mensagem=mensagem,
                upa=escala.upa,
                municipio=escala.upa.municipio,
            )
            criados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'[OK] Verificacao concluida: {criados} alerta(s) criado(s), '
                f'{pulados} situacao(oes) ignorada(s).'
            )
        )
