from django.core.management.base import BaseCommand
from api.models import Especialidade, Usuario


class Command(BaseCommand):
    help = 'Cria dados iniciais: especialidades e super admin'

    def handle(self, *args, **kwargs):
        # Especialidades padrão
        especialidades = [
            'Clínica Geral', 'Ortopedia', 'Pediatria',
            'Ginecologia', 'Cardiologia', 'Neurologia',
            'Oftalmologia', 'Dermatologia', 'Psiquiatria',
        ]
        for nome in especialidades:
            obj, criado = Especialidade.objects.get_or_create(nome=nome)
            if criado:
                self.stdout.write(f'  [OK] Especialidade criada: {nome}')

        # Super Admin inicial
        if not Usuario.objects.filter(perfil='super_admin').exists():
            Usuario.objects.create_user(
                email='admin@medbusca.gov.br',
                nome='Administrador MedBusca',
                perfil='super_admin',
                senha='MedBusca@2026',
                is_staff=True,
                is_superuser=True,
            )
            self.stdout.write(self.style.SUCCESS(
                '\n  [OK] Super Admin criado:'
                '\n    Email: admin@medbusca.gov.br'
                '\n    Senha: MedBusca@2026'
                '\n    [ATENCAO] Altere a senha apos o primeiro acesso!'
            ))
        else:
            self.stdout.write('  -> Super Admin ja existe.')

        self.stdout.write(self.style.SUCCESS('\n[CONCLUIDO] Seed concluido!'))
