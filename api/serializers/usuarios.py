import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from api.core.email_service import enviar_email_ativacao
from api.models import TokenAtivacao, Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "perfil", "municipio", "upa", "is_active", "criado_em"]
        read_only_fields = ["id", "criado_em"]


class UsuarioCriarSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = ["nome", "email", "perfil", "senha", "municipio", "upa"]

    def create(self, validated_data):
        senha = validated_data.pop("senha", None)
        user = Usuario(**validated_data)
        if user.perfil == "gestor_upa" and user.upa and not user.municipio:
            user.municipio = user.upa.municipio
        if senha:
            user.set_password(senha)
        else:
            user.set_unusable_password()
        user.save()

        if user.perfil in ("gestor_municipal", "gestor_upa"):
            token_str = secrets.token_urlsafe(48)
            TokenAtivacao.objects.create(
                usuario=user,
                token=token_str,
                expira_em=timezone.now() + timedelta(hours=24),
            )
            contexto = ""
            if user.perfil == "gestor_municipal" and user.municipio:
                contexto = f"Você é responsável pelo município de {user.municipio.nome}/{user.municipio.uf}"
            elif user.perfil == "gestor_upa" and user.upa:
                contexto = f"Você é responsável pela {user.upa.nome}"
            enviar_email_ativacao(
                user.nome,
                user.email,
                token_str,
                perfil=user.perfil,
                contexto=contexto,
            )

        return user
