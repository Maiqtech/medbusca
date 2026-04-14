from django.db import models


class TokenAtivacao(models.Model):
    usuario = models.OneToOneField(
        "api.Usuario",
        on_delete=models.CASCADE,
        related_name="token_ativacao",
    )
    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        app_label = "api"
        db_table = "tokens_ativacao"

    def __str__(self):
        return f"Token de {self.usuario.email}"


class TokenRedefinicaoSenha(models.Model):
    usuario = models.ForeignKey(
        "api.Usuario",
        on_delete=models.CASCADE,
        related_name="tokens_redefinicao",
    )
    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        app_label = "api"
        db_table = "tokens_redefinicao_senha"

    def __str__(self):
        return f"Redefinição de {self.usuario.email}"
