from rest_framework import serializers

from api.models import Especialidade, Turno, UPA
from api.serializers.especialidades import EspecialidadeSerializer


class UPASerializer(serializers.ModelSerializer):
    especialidades = serializers.SerializerMethodField()
    municipio_nome = serializers.CharField(source="municipio.nome", read_only=True)
    municipio_uf = serializers.CharField(source="municipio.uf", read_only=True)
    total_medicos = serializers.SerializerMethodField()
    em_atendimento = serializers.SerializerMethodField()
    em_pausa = serializers.SerializerMethodField()
    encerrados = serializers.SerializerMethodField()

    class Meta:
        model = UPA
        fields = [
            "id",
            "nome",
            "endereco",
            "bairro",
            "municipio",
            "municipio_nome",
            "municipio_uf",
            "latitude",
            "longitude",
            "especialidades",
            "ativa",
            "criado_em",
            "total_medicos",
            "em_atendimento",
            "em_pausa",
            "encerrados",
        ]
        read_only_fields = ["id", "criado_em"]

    def get_especialidades(self, obj):
        esp_ids = obj.medicos.values_list("especialidade_id", flat=True).distinct()
        return EspecialidadeSerializer(Especialidade.objects.filter(id__in=esp_ids), many=True).data

    def get_total_medicos(self, obj):
        return obj.medicos.count()

    def get_em_atendimento(self, obj):
        return Turno.objects.filter(medico__upa=obj, status="em_atendimento").count()

    def get_em_pausa(self, obj):
        return Turno.objects.filter(medico__upa=obj, status="em_pausa").count()

    def get_encerrados(self, obj):
        from django.utils import timezone

        hoje = timezone.now().date()
        return Turno.objects.filter(medico__upa=obj, status="encerrado", iniciado_em__date=hoje).count()


class UPAPublicaSerializer(serializers.ModelSerializer):
    especialidades = serializers.SerializerMethodField()
    municipio_nome = serializers.CharField(source="municipio.nome", read_only=True)
    status_especialidade = serializers.SerializerMethodField()

    class Meta:
        model = UPA
        fields = [
            "id",
            "nome",
            "bairro",
            "municipio_nome",
            "especialidades",
            "status_especialidade",
            "latitude",
            "longitude",
        ]

    def get_especialidades(self, obj):
        esp_ids = obj.medicos.values_list("especialidade_id", flat=True).distinct()
        return EspecialidadeSerializer(Especialidade.objects.filter(id__in=esp_ids), many=True).data

    def get_status_especialidade(self, obj):
        especialidade_id = self.context.get("especialidade_id")
        if not especialidade_id:
            return None

        try:
            from datetime import datetime

            from django.utils import timezone

            medicos = obj.medicos.filter(especialidade_id=especialidade_id)
            if not medicos.exists():
                return {"disponivel": False, "proximo_turno": None}

            for medico in medicos:
                if medico.turnos.filter(status="em_atendimento").exists():
                    return {"disponivel": True, "proximo_turno": None}

            agora = timezone.now()
            proxima = None
            for medico in medicos:
                escala = medico.escalas.filter(data__gte=agora.date()).order_by("data", "hora_inicio").first()
                if escala and (
                    proxima is None or (escala.data, escala.hora_inicio) < (proxima.data, proxima.hora_inicio)
                ):
                    proxima = escala

            proximo_str = None
            if proxima:
                dias_diff = (proxima.data - agora.date()).days
                hora_fmt = proxima.hora_inicio.strftime("%H:%M")
                if dias_diff == 0:
                    hora_inicio = datetime.combine(proxima.data, proxima.hora_inicio)
                    if hora_inicio.replace(tzinfo=agora.tzinfo) > agora:
                        proximo_str = f"hoje às {hora_fmt}"
                elif dias_diff == 1:
                    proximo_str = f"amanhã às {hora_fmt}"
                else:
                    proximo_str = f"{proxima.data.strftime('%d/%m')} às {hora_fmt}"

            return {"disponivel": False, "proximo_turno": proximo_str}
        except Exception:
            return {"disponivel": False, "proximo_turno": None}
