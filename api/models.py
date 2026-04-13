from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, perfil, senha=None, **extra):
        if not email:
            raise ValueError('Email é obrigatório.')
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, perfil=perfil, **extra)
        user.set_password(senha)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome, senha=None, **extra):
        return self.create_user(email, nome, 'super_admin', senha, is_staff=True, is_superuser=True, **extra)


class Usuario(AbstractBaseUser, PermissionsMixin):
    PERFIL_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('gestor_municipal', 'Gestor Municipal'),
        ('gestor_upa', 'Gestor de UPA'),
        ('medico', 'Médico'),
    ]

    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=200)
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES)
    municipio = models.ForeignKey('Municipio', null=True, blank=True, on_delete=models.SET_NULL, related_name='usuarios')
    upa = models.ForeignKey('UPA', null=True, blank=True, on_delete=models.SET_NULL, related_name='usuarios')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return f'{self.nome} ({self.perfil})'


class Municipio(models.Model):
    nome = models.CharField(max_length=200)
    uf = models.CharField(max_length=2)
    logo_url = models.URLField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'municipios'
        verbose_name = 'Município'
        verbose_name_plural = 'Municípios'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome}/{self.uf}'


class Especialidade(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'especialidades'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class UPA(models.Model):
    nome = models.CharField(max_length=200)
    endereco = models.CharField(max_length=300, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    municipio = models.ForeignKey(Municipio, on_delete=models.CASCADE, related_name='upas')
    especialidades = models.ManyToManyField(Especialidade, blank=True, related_name='upas')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    ativa = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'upas'
        verbose_name = 'UPA'
        verbose_name_plural = 'UPAs'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} — {self.municipio.nome}'


class Medico(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='medico', null=True, blank=True)
    nome = models.CharField(max_length=200)
    crm = models.CharField(max_length=20, unique=True)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.PROTECT, related_name='medicos')
    upa = models.ForeignKey(UPA, on_delete=models.CASCADE, related_name='medicos')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'medicos'
        verbose_name = 'Médico'
        verbose_name_plural = 'Médicos'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} — {self.especialidade.nome}'

    @property
    def turno_atual(self):
        return self.turnos.filter(status__in=['em_atendimento', 'em_pausa']).first()


class Escala(models.Model):
    medico = models.ForeignKey(Medico, on_delete=models.CASCADE, related_name='escalas')
    upa = models.ForeignKey(UPA, on_delete=models.CASCADE, related_name='escalas')
    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'escalas'
        ordering = ['data', 'hora_inicio']

    def __str__(self):
        return f'{self.medico.nome} — {self.data} {self.hora_inicio}'


class Turno(models.Model):
    STATUS_CHOICES = [
        ('em_atendimento', 'Em Atendimento'),
        ('em_pausa', 'Em Pausa'),
        ('encerrado', 'Encerrado'),
    ]

    medico = models.ForeignKey(Medico, on_delete=models.CASCADE, related_name='turnos')
    escala = models.ForeignKey(Escala, null=True, blank=True, on_delete=models.SET_NULL, related_name='turnos')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='em_atendimento')
    iniciado_em = models.DateTimeField(auto_now_add=True)
    encerrado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'turnos'
        ordering = ['-iniciado_em']

    def __str__(self):
        return f'{self.medico.nome} — {self.status}'


class RegistroTurno(models.Model):
    ACAO_CHOICES = [
        ('inicio', 'Início'),
        ('pausa', 'Pausa'),
        ('retorno', 'Retorno'),
        ('encerramento', 'Encerramento'),
    ]

    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name='registros')
    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    registrado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'registros_turno'
        ordering = ['registrado_em']

    def __str__(self):
        return f'{self.turno.medico.nome} — {self.acao}'


class TokenAtivacao(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='token_ativacao')
    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'tokens_ativacao'

    def __str__(self):
        return f'Token de {self.usuario.email}'


class TokenRedefinicaoSenha(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='tokens_redefinicao')
    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'tokens_redefinicao_senha'

    def __str__(self):
        return f'Redefinição de {self.usuario.email}'


class Alerta(models.Model):
    TIPO_CHOICES = [
        ('critico', 'Crítico'),
        ('aviso', 'Aviso'),
        ('informativo', 'Informativo'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensagem = models.TextField()
    upa = models.ForeignKey(UPA, null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
    municipio = models.ForeignKey(Municipio, null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
    resolvido = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    resolvido_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alertas'
        ordering = ['-criado_em']

    def __str__(self):
        return f'[{self.tipo}] {self.mensagem[:50]}'
