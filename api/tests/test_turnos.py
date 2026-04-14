from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from api.apps.turnos.services import build_meu_turno_payload
from api.models import Especialidade, Medico, Municipio, RegistroTurno, Turno, UPA, Usuario


class TurnosMedicoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.municipio = Municipio.objects.create(nome="Salvador", uf="BA")
        self.especialidade = Especialidade.objects.create(nome="Clinica Geral")
        self.upa = UPA.objects.create(nome="UPA Central", bairro="Centro", municipio=self.municipio)
        self.usuario = Usuario.objects.create_user(
            email="medico@example.com",
            nome="Dr. Teste",
            perfil="medico",
            senha="123456",
            upa=self.upa,
        )
        self.medico = Medico.objects.create(
            usuario=self.usuario,
            nome="Dr. Teste",
            crm="CRM123",
            especialidade=self.especialidade,
            upa=self.upa,
        )
        self.client.force_authenticate(user=self.usuario)

    def criar_turno_pendente(self, status="em_pausa"):
        iniciado_em = timezone.localtime() - timedelta(days=1, hours=2)
        pausa_em = iniciado_em + timedelta(hours=3)

        turno = Turno.objects.create(medico=self.medico, status=status)
        Turno.objects.filter(pk=turno.pk).update(iniciado_em=iniciado_em, status=status)

        registro_inicio = RegistroTurno.objects.create(turno=turno, acao="inicio")
        RegistroTurno.objects.filter(pk=registro_inicio.pk).update(registrado_em=iniciado_em)

        if status == "em_pausa":
            registro_pausa = RegistroTurno.objects.create(turno=turno, acao="pausa")
            RegistroTurno.objects.filter(pk=registro_pausa.pk).update(registrado_em=pausa_em)

        turno.refresh_from_db()
        return turno, iniciado_em, pausa_em

    def criar_turno_encerrado(self, dias_atras, duracao_horas=6, duracao_minutos=30):
        iniciado_em = timezone.localtime() - timedelta(days=dias_atras, hours=4)
        encerrado_em = iniciado_em + timedelta(hours=duracao_horas, minutes=duracao_minutos)

        turno = Turno.objects.create(medico=self.medico, status="encerrado")
        Turno.objects.filter(pk=turno.pk).update(
            iniciado_em=iniciado_em,
            encerrado_em=encerrado_em,
            status="encerrado",
        )
        turno.refresh_from_db()

        registro_inicio = RegistroTurno.objects.create(turno=turno, acao="inicio")
        RegistroTurno.objects.filter(pk=registro_inicio.pk).update(registrado_em=iniciado_em)
        registro_encerramento = RegistroTurno.objects.create(turno=turno, acao="encerramento")
        RegistroTurno.objects.filter(pk=registro_encerramento.pk).update(registrado_em=encerrado_em)

        turno.refresh_from_db()
        return turno

    def test_build_meu_turno_payload_retorna_turno_pendente_anterior(self):
        turno, _, _ = self.criar_turno_pendente()

        payload = build_meu_turno_payload(self.usuario)

        self.assertIsNone(payload["turno"])
        self.assertEqual(payload["turno_pendente_anterior"]["id"], turno.id)

    def test_build_meu_turno_payload_retorna_historico_de_outros_dias(self):
        turno = self.criar_turno_encerrado(dias_atras=2)

        payload = build_meu_turno_payload(self.usuario)

        self.assertEqual(len(payload["historico_outros_dias"]), 1)
        self.assertEqual(payload["historico_outros_dias"][0]["id"], turno.id)
        self.assertEqual(payload["historico_outros_dias"][0]["duracao_formatada"], "6h 30m")

    def test_build_meu_turno_payload_limita_resumo_a_tres_dias(self):
        for dias_atras in [1, 2, 3, 4]:
            self.criar_turno_encerrado(dias_atras=dias_atras)

        payload = build_meu_turno_payload(self.usuario)

        self.assertEqual(len(payload["historico_outros_dias"]), 3)

    def test_meu_historico_retorna_historico_completo_do_medico(self):
        turnos = [self.criar_turno_encerrado(dias_atras=dias) for dias in [1, 2, 3, 4]]

        response = self.client.get("/api/turnos/meu/historico/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["historico"]), 4)
        self.assertEqual(response.data["historico"][0]["id"], turnos[0].id)
        self.assertEqual(response.data["historico"][-1]["id"], turnos[-1].id)

    def test_iniciar_turno_bloqueia_quando_existe_pendencia_anterior(self):
        turno, _, _ = self.criar_turno_pendente()

        response = self.client.post("/api/turnos/iniciar/", {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["codigo"], "turno_pendente_anterior")
        self.assertEqual(response.data["turno_pendente_anterior"]["id"], turno.id)

    def test_encerrar_turno_permite_data_hora_retroativas_para_turno_pendente(self):
        turno, _, pausa_em = self.criar_turno_pendente()
        encerrado_em = (pausa_em + timedelta(hours=1, minutes=30)).replace(second=0, microsecond=0)

        response = self.client.post(
            "/api/turnos/encerrar/",
            {
                "turno_id": turno.id,
                "encerrado_em": encerrado_em.strftime("%Y-%m-%dT%H:%M"),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        turno.refresh_from_db()
        self.assertEqual(turno.status, "encerrado")
        self.assertEqual(
            timezone.localtime(turno.encerrado_em).replace(second=0, microsecond=0),
            encerrado_em,
        )

        registro_encerramento = turno.registros.order_by("-registrado_em").first()
        self.assertEqual(registro_encerramento.acao, "encerramento")
        self.assertEqual(
            timezone.localtime(registro_encerramento.registrado_em).replace(second=0, microsecond=0),
            encerrado_em,
        )

    def test_encerrar_turno_retroativo_valida_ultimo_registro(self):
        turno, _, pausa_em = self.criar_turno_pendente()

        response = self.client.post(
            "/api/turnos/encerrar/",
            {
                "turno_id": turno.id,
                "encerrado_em": pausa_em.strftime("%Y-%m-%dT%H:%M"),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("ultimo registro", response.data["erro"])
