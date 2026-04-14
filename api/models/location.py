from django.db import models


class Municipio(models.Model):
    nome = models.CharField(max_length=200)
    uf = models.CharField(max_length=2)
    logo_url = models.URLField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "api"
        db_table = "municipios"
        verbose_name = "Município"
        verbose_name_plural = "Municípios"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome}/{self.uf}"


class UPA(models.Model):
    nome = models.CharField(max_length=200)
    endereco = models.CharField(max_length=300, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    municipio = models.ForeignKey(
        "api.Municipio",
        on_delete=models.CASCADE,
        related_name="upas",
    )
    especialidades = models.ManyToManyField(
        "api.Especialidade",
        blank=True,
        related_name="upas",
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    ativa = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "api"
        db_table = "upas"
        verbose_name = "UPA"
        verbose_name_plural = "UPAs"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} — {self.municipio.nome}"
