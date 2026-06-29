from django.db import models


class Escala(models.Model):
    medico = models.ForeignKey(
        "api.Medico",
        on_delete=models.CASCADE,
        related_name="escalas",
    )
    upa = models.ForeignKey(
        "api.UPA",
        on_delete=models.CASCADE,
        related_name="escalas",
    )
    STATUS_CHOICES = [
        ("agendada", "Agendada"),
        ("ativa", "Ativa"),
        ("cancelada", "Cancelada"),
        ("concluida", "Concluída"),
    ]

    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="agendada")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_por = models.ForeignKey(
        "api.Usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="escalas_criadas",
    )
    atualizado_por = models.ForeignKey(
        "api.Usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="escalas_atualizadas",
    )

    class Meta:
        app_label = "api"
        db_table = "escalas"
        ordering = ["data", "hora_inicio"]

    def __str__(self):
        return f"{self.medico.nome} — {self.data} {self.hora_inicio}"


class Turno(models.Model):
    STATUS_CHOICES = [
        ("em_atendimento", "Em Atendimento"),
        ("em_pausa", "Em Pausa"),
        ("encerrado", "Encerrado"),
    ]

    medico = models.ForeignKey(
        "api.Medico",
        on_delete=models.CASCADE,
        related_name="turnos",
    )
    escala = models.ForeignKey(
        "api.Escala",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="turnos",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="em_atendimento")
    iniciado_em = models.DateTimeField(auto_now_add=True)
    encerrado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "api"
        db_table = "turnos"
        ordering = ["-iniciado_em"]

    def __str__(self):
        return f"{self.medico.nome} — {self.status}"


class RegistroTurno(models.Model):
    ACAO_CHOICES = [
        ("inicio", "Início"),
        ("pausa", "Pausa"),
        ("retorno", "Retorno"),
        ("encerramento", "Encerramento"),
    ]

    turno = models.ForeignKey(
        "api.Turno",
        on_delete=models.CASCADE,
        related_name="registros",
    )
    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    registrado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "api"
        db_table = "registros_turno"
        ordering = ["registrado_em"]

    def __str__(self):
        return f"{self.turno.medico.nome} — {self.acao}"
