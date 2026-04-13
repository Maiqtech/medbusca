import pytest
from api.models import Alerta, Municipio, UPA, Usuario
from api.management.commands.verificar_alertas_estruturais import (
    verificar_alertas_upa,
    verificar_alertas_municipio,
)


@pytest.fixture
def municipio(db):
    return Municipio.objects.create(nome='TesteMun', uf='BA')


@pytest.fixture
def upa(municipio):
    return UPA.objects.create(nome='UPA Teste', municipio=municipio)


@pytest.mark.django_db
def test_upa_sem_gestor_cria_alerta(upa):
    created, resolved = verificar_alertas_upa(upa)
    assert created is True
    assert resolved is False
    assert Alerta.objects.filter(upa=upa, resolvido=False, tipo='aviso').count() == 1


@pytest.mark.django_db
def test_upa_sem_gestor_nao_duplica(upa):
    verificar_alertas_upa(upa)
    created, _ = verificar_alertas_upa(upa)
    assert created is False
    assert Alerta.objects.filter(upa=upa, resolvido=False).count() == 1


@pytest.mark.django_db
def test_upa_com_gestor_resolve_alerta(upa, municipio):
    verificar_alertas_upa(upa)
    Usuario.objects.create_user(
        email='g@upa.com', nome='Gestor', perfil='gestor_upa',
        senha='senha123', upa=upa, municipio=municipio,
    )
    _, resolved = verificar_alertas_upa(upa)
    assert resolved is True
    assert Alerta.objects.filter(upa=upa, resolvido=False).count() == 0


@pytest.mark.django_db
def test_municipio_sem_gestor_cria_alerta(municipio):
    created, resolved = verificar_alertas_municipio(municipio)
    assert created is True
    assert Alerta.objects.filter(municipio=municipio, resolvido=False, tipo='informativo').count() == 1


@pytest.mark.django_db
def test_municipio_com_gestor_resolve_alerta(municipio):
    verificar_alertas_municipio(municipio)
    Usuario.objects.create_user(
        email='gm@mun.com', nome='Gestor Mun', perfil='gestor_municipal',
        senha='senha123', municipio=municipio,
    )
    _, resolved = verificar_alertas_municipio(municipio)
    assert resolved is True
    assert Alerta.objects.filter(municipio=municipio, resolvido=False).count() == 0
