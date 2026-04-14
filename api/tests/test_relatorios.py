from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from api.models import Especialidade, Medico, Municipio, Turno, UPA, Usuario


class RelatoriosApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.municipio = Municipio.objects.create(nome="Salvador", uf="BA")
        self.upa = UPA.objects.create(nome="UPA Central", bairro="Centro", municipio=self.municipio, ativa=True)
        self.especialidade = Especialidade.objects.create(nome="Clinica Geral")
        self.medico_usuario = Usuario.objects.create_user(
            email="medico@example.com",
            nome="Dr. Teste",
            perfil="medico",
            senha="123456",
            municipio=self.municipio,
            upa=self.upa,
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_usuario,
            nome="Dr. Teste",
            crm="CRM123",
            especialidade=self.especialidade,
            upa=self.upa,
        )
        self.gestor_upa = Usuario.objects.create_user(
            email="gestor.upa@example.com",
            nome="Gestor UPA",
            perfil="gestor_upa",
            senha="123456",
            municipio=self.municipio,
            upa=self.upa,
        )
        self.gestor_municipal = Usuario.objects.create_user(
            email="gestor.municipal@example.com",
            nome="Gestor Municipal",
            perfil="gestor_municipal",
            senha="123456",
            municipio=self.municipio,
        )

        turno = Turno.objects.create(medico=self.medico, status="encerrado")
        Turno.objects.filter(pk=turno.pk).update(
          iniciado_em=timezone.now() - timedelta(hours=5),
          encerrado_em=timezone.now() - timedelta(hours=1),
          status="encerrado",
        )

    def test_relatorio_upa_retorna_payload_para_gestor_upa(self):
        self.client.force_authenticate(user=self.gestor_upa)

        response = self.client.get(f"/api/relatorios/upa/{self.upa.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["upa"]["id"], self.upa.id)
        self.assertIn("detalhamento", response.data)

    def test_relatorio_municipio_retorna_payload_para_gestor_municipal(self):
        self.client.force_authenticate(user=self.gestor_municipal)

        response = self.client.get(f"/api/relatorios/municipio/{self.municipio.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_upas"], 1)
        self.assertEqual(response.data["upas"][0]["id"], self.upa.id)

    def test_relatorio_individual_do_medico_retorna_turnos_e_resumo(self):
        self.client.force_authenticate(user=self.gestor_upa)

        response = self.client.get(f"/api/relatorios/upa/{self.upa.id}/medico/{self.medico.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["medico"]["id"], self.medico.id)
        self.assertEqual(response.data["resumo"]["total_turnos"], 1)
        self.assertEqual(response.data["turnos"][0]["id"], Turno.objects.first().id)
