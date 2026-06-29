from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, perfil, senha=None, **extra):
        if not email:
            raise ValueError("Email é obrigatório.")
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, perfil=perfil, **extra)
        user.set_password(senha)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome, senha=None, **extra):
        return self.create_user(
            email,
            nome,
            "super_admin",
            senha,
            is_staff=True,
            is_superuser=True,
            **extra,
        )


class Usuario(AbstractBaseUser, PermissionsMixin):
    PERFIL_CHOICES = [
        ("super_admin", "Super Admin"),
        ("gestor_municipal", "Gestor Municipal"),
        ("gestor_upa", "Gestor de UPA"),
        ("medico", "Médico"),
    ]

    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=200)
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES)
    municipio = models.ForeignKey(
        "api.Municipio",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios",
    )
    upa = models.ForeignKey(
        "api.UPA",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    objects = UsuarioManager()

    class Meta:
        app_label = "api"
        db_table = "usuarios"
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def __str__(self):
        return f"{self.nome} ({self.perfil})"
