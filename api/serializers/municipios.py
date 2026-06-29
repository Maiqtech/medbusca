from rest_framework import serializers

from api.models import Medico, Municipio, Usuario


class MunicipioSerializer(serializers.ModelSerializer):
    total_upas = serializers.SerializerMethodField()
    total_gestores = serializers.SerializerMethodField()
    total_medicos = serializers.SerializerMethodField()
    unidades_ativas = serializers.SerializerMethodField()
    criado_por_nome = serializers.CharField(source="criado_por.nome", read_only=True, default=None)
    atualizado_por_nome = serializers.CharField(source="atualizado_por.nome", read_only=True, default=None)

    class Meta:
        model = Municipio
        fields = [
            "id",
            "nome",
            "uf",
            "logo_url",
            "ativo",
            "criado_em",
            "atualizado_em",
            "criado_por_nome",
            "atualizado_por_nome",
            "total_upas",
            "total_gestores",
            "total_medicos",
            "unidades_ativas",
        ]
        read_only_fields = ["id", "criado_em", "atualizado_em"]

    def get_total_upas(self, obj):
        return obj.upas.count()

    def get_total_gestores(self, obj):
        return Usuario.objects.filter(is_active=True, perfil="gestor_municipal", municipio=obj).count()

    def get_total_medicos(self, obj):
        return Medico.objects.filter(upa__municipio=obj).count()

    def get_unidades_ativas(self, obj):
        return obj.upas.filter(ativa=True).count()
