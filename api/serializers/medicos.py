import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from api.core.email_service import enviar_email_ativacao
from api.models import Medico, TokenAtivacao, Usuario


class MedicoSerializer(serializers.ModelSerializer):
    especialidade_nome = serializers.CharField(source="especialidade.nome", read_only=True)
    upa_nome = serializers.CharField(source="upa.nome", read_only=True)
    status_turno = serializers.SerializerMethodField()
    turno_iniciado_em = serializers.SerializerMethodField()
    criado_por_nome = serializers.CharField(source="criado_por.nome", read_only=True, default=None)
    atualizado_por_nome = serializers.CharField(source="atualizado_por.nome", read_only=True, default=None)

    class Meta:
        model = Medico
        fields = [
            "id",
            "nome",
            "crm",
            "uf",
            "especialidade",
            "especialidade_nome",
            "upa",
            "upa_nome",
            "criado_em",
            "atualizado_em",
            "criado_por_nome",
            "atualizado_por_nome",
            "status_turno",
            "turno_iniciado_em",
        ]
        read_only_fields = ["id", "criado_em", "atualizado_em"]

    def get_status_turno(self, obj):
        turno = obj.turno_atual
        return turno.status if turno else "offline"

    def get_turno_iniciado_em(self, obj):
        turno = obj.turno_atual
        return turno.iniciado_em if turno else None


class MedicoCriarSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    senha = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Medico
        fields = ["nome", "crm", "uf", "especialidade", "upa", "email", "senha"]

    def validate(self, attrs):
        crm = attrs.get("crm", "")
        uf = attrs.get("uf", "")
        if Medico.objects.filter(crm=crm, uf=uf).exists():
            raise serializers.ValidationError({"crm": "CRM já cadastrado para este estado."})
        return attrs

    def create(self, validated_data):
        email = validated_data.pop("email", None)
        senha = validated_data.pop("senha", None)

        usuario = None
        if email:
            if Usuario.objects.filter(email=email, is_active=True).exists():
                raise serializers.ValidationError({"email": "E-mail já cadastrado."})
            usuario = Usuario.objects.create_user(
                email=email,
                nome=validated_data["nome"],
                perfil="medico",
                senha=senha or secrets.token_urlsafe(12),
                upa=validated_data.get("upa"),
            )

        medico = Medico.objects.create(usuario=usuario, **validated_data)

        if usuario and email:
            token_str = secrets.token_urlsafe(48)
            TokenAtivacao.objects.create(
                usuario=usuario,
                token=token_str,
                expira_em=timezone.now() + timedelta(hours=24),
            )
            upa_nome = medico.upa.nome if medico.upa else ""
            esp_nome = medico.especialidade.nome if medico.especialidade else ""
            contexto = f"Especialidade: {esp_nome}"
            if upa_nome:
                contexto += f" — {upa_nome}"
            enviar_email_ativacao(
                usuario.nome,
                email,
                token_str,
                perfil="medico",
                contexto=contexto,
            )

        return medico
