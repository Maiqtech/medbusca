from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Municipio, Especialidade, UPA, Medico, Escala, Turno, RegistroTurno, Alerta


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['nome', 'email', 'perfil', 'municipio', 'upa', 'is_active']
    list_filter = ['perfil', 'is_active']
    search_fields = ['nome', 'email']
    ordering = ['nome']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações', {'fields': ('nome', 'perfil', 'municipio', 'upa')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'nome', 'perfil', 'password1', 'password2', 'municipio', 'upa')}),
    )


@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'uf', 'ativo', 'criado_em']
    list_filter = ['uf', 'ativo']
    search_fields = ['nome']


@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ['nome']


@admin.register(UPA)
class UPAAdmin(admin.ModelAdmin):
    list_display = ['nome', 'bairro', 'municipio', 'ativa', 'criado_em']
    list_filter = ['ativa', 'municipio']
    search_fields = ['nome', 'bairro']
    filter_horizontal = ['especialidades']


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'crm', 'especialidade', 'upa', 'criado_em']
    list_filter = ['especialidade', 'upa']
    search_fields = ['nome', 'crm']


@admin.register(Escala)
class EscalaAdmin(admin.ModelAdmin):
    list_display = ['medico', 'upa', 'data', 'hora_inicio', 'hora_fim']
    list_filter = ['data', 'upa']


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ['medico', 'status', 'iniciado_em', 'encerrado_em']
    list_filter = ['status']


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'mensagem', 'upa', 'municipio', 'resolvido', 'criado_em']
    list_filter = ['tipo', 'resolvido']
