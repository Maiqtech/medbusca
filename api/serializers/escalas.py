from rest_framework import serializers

from api.models import Escala


class EscalaSerializer(serializers.ModelSerializer):
    medico_nome = serializers.CharField(source="medico.nome", read_only=True)
    especialidade_nome = serializers.CharField(source="medico.especialidade.nome", read_only=True)
    upa_nome = serializers.CharField(source="upa.nome", read_only=True)

    class Meta:
        model = Escala
        fields = [
            "id",
            "medico",
            "medico_nome",
            "especialidade_nome",
            "upa",
            "upa_nome",
            "data",
            "hora_inicio",
            "hora_fim",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em", "upa"]

    def create(self, validated_data):
        validated_data["upa"] = validated_data["medico"].upa
        return super().create(validated_data)
