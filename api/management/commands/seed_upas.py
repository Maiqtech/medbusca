from django.core.management.base import BaseCommand
from api.models import UPA, Municipio


class Command(BaseCommand):
    help = 'Cria UPAs de Salvador'

    def handle(self, *args, **kwargs):
        municipio = Municipio.objects.filter(nome='Salvador', uf='BA').first()
        if not municipio:
            self.stdout.write(self.style.ERROR('Município Salvador não encontrado!'))
            return

        upas = [
            {'nome': 'UPA Brotas', 'endereco': 'Rua Jardim Madalena, s/n', 'bairro': 'Campinas de Brotas', 'lat': -12.9789, 'lng': -38.4833},
            {'nome': 'UPA Periperi Professor Adroaldo Albergaria', 'endereco': 'Rua das Pedrinhas, 358', 'bairro': 'Periperi', 'lat': -12.9667, 'lng': -38.4667},
            {'nome': 'UPA Vale dos Barris', 'endereco': 'Praça Dr. João Mangabeira', 'bairro': 'Garcia', 'lat': -13.0089, 'lng': -38.5222},
            {'nome': 'UPA Pirajá / Santo Inácio', 'endereco': 'Rua Direta de Santo Inácio, s/n', 'bairro': 'Jardim Santo Inácio', 'lat': -12.9422, 'lng': -38.4556},
            {'nome': 'UPA Paripe', 'endereco': 'Rua São Gonçalo de Paripe, 2-62', 'bairro': 'Paripe', 'lat': -12.9711, 'lng': -38.4578},
            {'nome': 'UPA Valéria', 'endereco': 'Colégio Noemia Rego - R. do Lavrador, s/n', 'bairro': 'Valéria', 'lat': -12.9533, 'lng': -38.4622},
            {'nome': 'UPA San Martin', 'endereco': 'Rua do Forno, s/n', 'bairro': 'Santa Monica', 'lat': -13.0128, 'lng': -38.5389},
            {'nome': 'UPA Santo Antônio', 'endereco': 'Avenida Dendezeiros do Bonfim, 1', 'bairro': 'Roma', 'lat': -13.0067, 'lng': -38.5578},
            {'nome': 'UPA Itapuã Dr. Hélio Machado', 'endereco': 'Rua da Cacimba, S/N', 'bairro': 'Itapuã', 'lat': -13.0089, 'lng': -38.2711},
            {'nome': 'UPA Cabula', 'endereco': 'Rua Direta do Saboeiro, 1ª Travessa do Saboeiro, s/n', 'bairro': 'Saboeiro', 'lat': -12.9256, 'lng': -38.4956},
            {'nome': 'UPA São Cristóvão III Municipal', 'endereco': 'Rua Arquiteto Marcos, M. Solter, s/n', 'bairro': 'São Cristóvão', 'lat': -13.0156, 'lng': -38.4911},
        ]

        for upa_data in upas:
            upa, criada = UPA.objects.get_or_create(
                nome=upa_data['nome'],
                defaults={
                    'municipio': municipio,
                    'endereco': upa_data['endereco'],
                    'bairro': upa_data['bairro'],
                    'latitude': upa_data.get('lat'),
                    'longitude': upa_data.get('lng'),
                }
            )
            if criada:
                self.stdout.write(f'✓ UPA criada: {upa_data["nome"]}')
            else:
                self.stdout.write(f'→ UPA já existe: {upa_data["nome"]}')

        self.stdout.write(self.style.SUCCESS('\n[CONCLUIDO] UPAs de Salvador criadas!'))
