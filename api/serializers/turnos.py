from rest_framework import serializers

from api.models import RegistroTurno, Turno


class RegistroTurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroTurno
        fields = ["id", "acao", "registrado_em"]


class TurnoSerializer(serializers.ModelSerializer):
    medico_nome = serializers.CharField(source="medico.nome", read_only=True)
    especialidade_nome = serializers.CharField(source="medico.especialidade.nome", read_only=True)
    registros = RegistroTurnoSerializer(many=True, read_only=True)

    class Meta:
        model = Turno
        fields = [
            "id",
            "medico",
            "medico_nome",
            "especialidade_nome",
            "status",
            "iniciado_em",
            "encerrado_em",
            "registros",
        ]
        read_only_fields = ["id", "iniciado_em", "encerrado_em", "status"]
