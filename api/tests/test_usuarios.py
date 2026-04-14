from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Municipio, UPA, Usuario


class UsuariosApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.municipio = Municipio.objects.create(nome="Salvador", uf="BA")
        self.upa_pituacu = UPA.objects.create(nome="UPA Pituaçu", bairro="Pituaçu", municipio=self.municipio)
        self.upa_itapua = UPA.objects.create(nome="UPA Itapuã", bairro="Itapuã", municipio=self.municipio)
        self.gestor_municipal = Usuario.objects.create_user(
            email="gestor.municipal@example.com",
            nome="Gestor Municipal",
            perfil="gestor_municipal",
            senha="123456",
            municipio=self.municipio,
        )
        self.gestor_upa_pituacu = Usuario.objects.create_user(
            email="gestor.pituacu@example.com",
            nome="Gestor Pituaçu",
            perfil="gestor_upa",
            senha="123456",
            municipio=self.municipio,
            upa=self.upa_pituacu,
        )
        self.gestor_upa_itapua = Usuario.objects.create_user(
            email="gestor.itapua@example.com",
            nome="Gestor Itapuã",
            perfil="gestor_upa",
            senha="123456",
            municipio=self.municipio,
            upa=self.upa_itapua,
        )

    def test_lista_gestores_por_upa_filtra_corretamente(self):
        self.client.force_authenticate(user=self.gestor_municipal)

        response = self.client.get(f"/api/usuarios/?perfil=gestor_upa&upa_id={self.upa_pituacu.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.gestor_upa_pituacu.id)
