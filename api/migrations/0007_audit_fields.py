from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0006_populate_especialidades"),
    ]

    operations = [
        # Municipio
        migrations.AddField(
            model_name="municipio",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="municipio",
            name="criado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="municipios_criados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="municipio",
            name="atualizado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="municipios_atualizados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # UPA
        migrations.AddField(
            model_name="upa",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="upa",
            name="criado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="upas_criadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="upa",
            name="atualizado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="upas_atualizadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Medico
        migrations.AddField(
            model_name="medico",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="medico",
            name="criado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="medicos_criados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="medico",
            name="atualizado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="medicos_atualizados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Escala
        migrations.AddField(
            model_name="escala",
            name="status",
            field=models.CharField(
                choices=[
                    ("agendada", "Agendada"),
                    ("ativa", "Ativa"),
                    ("cancelada", "Cancelada"),
                    ("concluida", "Concluída"),
                ],
                default="agendada",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="escala",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="escala",
            name="criado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="escalas_criadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="escala",
            name="atualizado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="escalas_atualizadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Usuario
        migrations.AddField(
            model_name="usuario",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
