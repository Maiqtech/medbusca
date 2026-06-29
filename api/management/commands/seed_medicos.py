from django.core.management.base import BaseCommand
from api.models import Medico, UPA, Especialidade, Usuario


class Command(BaseCommand):
    help = 'Cria médicos nas UPAs de Salvador'

    def handle(self, *args, **kwargs):
        # Busca especialidades
        psiquiatria = Especialidade.objects.filter(nome='Psiquiatria').first()
        clinica_geral = Especialidade.objects.filter(nome='Clínica Geral').first()
        pediatria = Especialidade.objects.filter(nome='Pediatria').first()
        ortopedia = Especialidade.objects.filter(nome='Ortopedia').first()
        cardiologia = Especialidade.objects.filter(nome='Cardiologia').first()

        # Busca UPAs
        upas = {
            'Brotas': UPA.objects.filter(nome__icontains='Brotas').first(),
            'Periperi': UPA.objects.filter(nome__icontains='Periperi').first(),
            'Vale dos Barris': UPA.objects.filter(nome__icontains='Vale dos Barris').first(),
            'Santo Inácio': UPA.objects.filter(nome__icontains='Santo Inácio').first(),
            'Itapuã': UPA.objects.filter(nome__icontains='Itapuã').first(),
        }

        medicos_data = [
            {'nome': 'Dr. João Silva', 'crm': '123456', 'uf': 'BA', 'especialidade': psiquiatria, 'upa': upas['Brotas'], 'email': 'joao@medicos.com'},
            {'nome': 'Dra. Maria Santos', 'crm': '123457', 'uf': 'BA', 'especialidade': clinica_geral, 'upa': upas['Brotas'], 'email': 'maria@medicos.com'},
            {'nome': 'Dr. Carlos Oliveira', 'crm': '123458', 'uf': 'BA', 'especialidade': pediatria, 'upa': upas['Periperi'], 'email': 'carlos@medicos.com'},
            {'nome': 'Dra. Ana Costa', 'crm': '123459', 'uf': 'BA', 'especialidade': clinica_geral, 'upa': upas['Periperi'], 'email': 'ana@medicos.com'},
            {'nome': 'Dr. Pedro Ferreira', 'crm': '123460', 'uf': 'BA', 'especialidade': ortopedia, 'upa': upas['Vale dos Barris'], 'email': 'pedro@medicos.com'},
            {'nome': 'Dra. Paula Mendes', 'crm': '123461', 'uf': 'BA', 'especialidade': cardiologia, 'upa': upas['Vale dos Barris'], 'email': 'paula@medicos.com'},
            {'nome': 'Dr. Roberto Alves', 'crm': '123462', 'uf': 'BA', 'especialidade': clinica_geral, 'upa': upas['Santo Inácio'], 'email': 'roberto@medicos.com'},
            {'nome': 'Dra. Fernanda Lima', 'crm': '123463', 'uf': 'BA', 'especialidade': pediatria, 'upa': upas['Santo Inácio'], 'email': 'fernanda@medicos.com'},
            {'nome': 'Dr. Lucas Barbosa', 'crm': '123464', 'uf': 'BA', 'especialidade': psiquiatria, 'upa': upas['Itapuã'], 'email': 'lucas@medicos.com'},
            {'nome': 'Dra. Camila Rocha', 'crm': '123465', 'uf': 'BA', 'especialidade': clinica_geral, 'upa': upas['Itapuã'], 'email': 'camila@medicos.com'},
        ]

        criados = 0
        for medico_data in medicos_data:
            if not medico_data['upa'] or not medico_data['especialidade']:
                continue

            # Cria usuário para o médico
            usuario, _ = Usuario.objects.get_or_create(
                email=medico_data['email'],
                defaults={
                    'nome': medico_data['nome'],
                    'perfil': 'medico',
                    'is_active': True,
                }
            )
            usuario.set_unusable_password()
            usuario.save()

            # Cria médico
            medico, criado = Medico.objects.get_or_create(
                crm=medico_data['crm'],
                uf=medico_data['uf'],
                defaults={
                    'nome': medico_data['nome'],
                    'especialidade': medico_data['especialidade'],
                    'upa': medico_data['upa'],
                    'usuario': usuario,
                }
            )
            if criado:
                self.stdout.write(f'✓ Médico criado: {medico_data["nome"]} - {medico_data["especialidade"].nome}')
                criados += 1
            else:
                self.stdout.write(f'→ Médico já existe: {medico_data["nome"]}')

        self.stdout.write(self.style.SUCCESS(f'\n[CONCLUIDO] {criados} médicos criados!'))
