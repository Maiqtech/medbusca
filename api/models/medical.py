from datetime import timedelta

from django.db import models
from django.utils import timezone


ACTIVE_TURNO_STATUSES = ("em_atendimento", "em_pausa")


def get_turno_day_bounds():
    now_local = timezone.localtime()
    day_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    return day_start, day_start + timedelta(days=1)


class Especialidade(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        app_label = "api"
        db_table = "especialidades"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Medico(models.Model):
    usuario = models.OneToOneField(
        "api.Usuario",
        on_delete=models.CASCADE,
        related_name="medico",
        null=True,
        blank=True,
    )
    nome = models.CharField(max_length=200)
    crm = models.CharField(max_length=20, unique=True)
    especialidade = models.ForeignKey(
        "api.Especialidade",
        on_delete=models.PROTECT,
        related_name="medicos",
    )
    upa = models.ForeignKey(
        "api.UPA",
        on_delete=models.CASCADE,
        related_name="medicos",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "api"
        db_table = "medicos"
        verbose_name = "Médico"
        verbose_name_plural = "Médicos"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} — {self.especialidade.nome}"

    @property
    def turno_atual(self):
        day_start, day_end = get_turno_day_bounds()
        return self.turnos.filter(
            status__in=ACTIVE_TURNO_STATUSES,
            iniciado_em__gte=day_start,
            iniciado_em__lt=day_end,
        ).first()

    @property
    def turno_pendente_anterior(self):
        day_start, _ = get_turno_day_bounds()
        return self.turnos.filter(
            status__in=ACTIVE_TURNO_STATUSES,
            iniciado_em__lt=day_start,
        ).first()
