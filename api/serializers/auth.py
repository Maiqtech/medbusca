from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MedBuscaTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["perfil"] = user.perfil
        token["nome"] = user.nome
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["usuario"] = {
            "id": self.user.id,
            "nome": self.user.nome,
            "email": self.user.email,
            "perfil": self.user.perfil,
            "municipio_id": self.user.municipio_id,
            "municipio_nome": self.user.municipio.nome if self.user.municipio else None,
            "upa_id": self.user.upa_id,
            "upa_nome": self.user.upa.nome if self.user.upa else None,
        }
        return data
