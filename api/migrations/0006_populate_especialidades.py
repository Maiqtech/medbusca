from django.db import migrations

ESPECIALIDADES = [
    "Acupuntura",
    "Alergia e Imunologia",
    "Anestesiologia",
    "Angiologia",
    "Cancerologia (Oncologia)",
    "Cardiologia",
    "Cirurgia Cardiovascular",
    "Cirurgia da Mão",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral",
    "Cirurgia Pediátrica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Clínica Médica",
    "Coloproctologia",
    "Dermatologia",
    "Endocrinologia e Metabologia",
    "Endoscopia",
    "Gastroenterologia",
    "Genética Médica",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia e Hemoterapia",
    "Homeopatia",
    "Infectologia",
    "Mastologia",
    "Medicina de Emergência",
    "Medicina de Família e Comunidade",
    "Medicina do Trabalho",
    "Medicina do Tráfego",
    "Medicina Esportiva",
    "Medicina Física e Reabilitação",
    "Medicina Intensiva",
    "Medicina Legal e Perícia Médica",
    "Medicina Nuclear",
    "Medicina Preventiva e Social",
    "Nefrologia",
    "Neurocirurgia",
    "Neurologia",
    "Nutrologia",
    "Oftalmologia",
    "Ortopedia e Traumatologia",
    "Otorrinolaringologia",
    "Patologia",
    "Patologia Clínica / Medicina Laboratorial",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Radiologia e Diagnóstico por Imagem",
    "Radioterapia",
    "Reumatologia",
    "Urologia",
    "Medicina Paliativa",
]


def populate(apps, schema_editor):
    Especialidade = apps.get_model("api", "Especialidade")
    for nome in ESPECIALIDADES:
        Especialidade.objects.get_or_create(nome=nome)


def despopulate(apps, schema_editor):
    Especialidade = apps.get_model("api", "Especialidade")
    Especialidade.objects.filter(nome__in=ESPECIALIDADES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0005_add_uf_medico"),
    ]

    operations = [
        migrations.RunPython(populate, despopulate),
    ]
