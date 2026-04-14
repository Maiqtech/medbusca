from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Municipio, UPA, Usuario


class UPAApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.municipio = Municipio.objects.create(nome="Salvador", uf="BA")
        self.upa_ativa = UPA.objects.create(nome="UPA Pituaçu", bairro="Pituaçu", municipio=self.municipio, ativa=True)
        self.upa_inativa = UPA.objects.create(nome="UPA Boca do Rio", bairro="Boca do Rio", municipio=self.municipio, ativa=False)
        self.gestor_municipal = Usuario.objects.create_user(
            email="gestor.municipal@example.com",
            nome="Gestor Municipal",
            perfil="gestor_municipal",
            senha="123456",
            municipio=self.municipio,
        )

    def test_lista_publica_de_upas_por_municipio_retorna_serializer_publico(self):
        response = self.client.get(f"/api/upas/?municipio_id={self.municipio.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.upa_ativa.id)
        self.assertNotIn("ativa", response.data[0])

    def test_lista_interna_de_upas_retorna_dados_completos_e_inativas(self):
        self.client.force_authenticate(user=self.gestor_municipal)

        response = self.client.get(f"/api/upas/?municipio_id={self.municipio.id}&interno=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertIn("ativa", response.data[0])
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.upa_ativa.id, self.upa_inativa.id})
