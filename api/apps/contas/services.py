import secrets
from dataclasses import asdict
from datetime import timedelta

from django.utils import timezone

from api.apps.contas.dtos import TokenAtivacaoDTO
from api.core.email_service import enviar_email_redefinicao_senha
from api.models import TokenAtivacao, TokenRedefinicaoSenha, Usuario


def get_activation_token_or_raise(token):
    try:
        activation_token = TokenAtivacao.objects.get(token=token, usado=False)
    except TokenAtivacao.DoesNotExist as exc:
        raise ValueError("Link inválido ou já utilizado.") from exc
    if timezone.now() > activation_token.expira_em:
        raise ValueError("Este link expirou. Solicite um novo ao administrador.")
    return activation_token


def get_activation_token_data(token):
    activation_token = get_activation_token_or_raise(token)
    email = activation_token.usuario.email
    # Remove o prefixo de inativo se existir
    if email.startswith("__inativo_"):
        email = email.split("__", 2)[-1]
    return TokenAtivacaoDTO(
        nome=activation_token.usuario.nome,
        email=email,
    ).to_dict()


def activate_account(token, senha):
    if not token or not senha:
        raise ValueError("Token e senha são obrigatórios.")
    if len(senha) < 6:
        raise ValueError("A senha deve ter pelo menos 6 caracteres.")

    activation_token = get_activation_token_or_raise(token)
    usuario = activation_token.usuario
    usuario.set_password(senha)
    usuario.is_active = True
    # Remove o prefixo de inativo se existir
    if usuario.email.startswith("__inativo_"):
        usuario.email = usuario.email.split("__", 2)[-1]
    usuario.save()
    activation_token.usado = True
    activation_token.save()
    return {"mensagem": "Senha criada com sucesso! Você já pode fazer login."}


def request_password_reset(email):
    email = (email or "").strip().lower()
    if not email:
        raise ValueError("Email é obrigatório.")

    try:
        usuario = Usuario.objects.get(email=email, is_active=True)
    except Usuario.DoesNotExist:
        return {"mensagem": "Se este email estiver cadastrado, você receberá um link em breve."}

    TokenRedefinicaoSenha.objects.filter(usuario=usuario, usado=False).update(usado=True)
    token_str = secrets.token_urlsafe(48)
    TokenRedefinicaoSenha.objects.create(
        usuario=usuario,
        token=token_str,
        expira_em=timezone.now() + timedelta(hours=1),
    )
    enviar_email_redefinicao_senha(usuario.nome, usuario.email, token_str)
    return {"mensagem": "Se este email estiver cadastrado, você receberá um link em breve."}


def reset_password(token, nova_senha):
    token = (token or "").strip()
    nova_senha = nova_senha or ""

    if not token or not nova_senha:
        raise ValueError("Token e nova senha são obrigatórios.")
    if len(nova_senha) < 6:
        raise ValueError("A senha deve ter pelo menos 6 caracteres.")

    try:
        reset_token = TokenRedefinicaoSenha.objects.get(token=token, usado=False)
    except TokenRedefinicaoSenha.DoesNotExist as exc:
        raise ValueError("Link inválido ou já utilizado.") from exc

    if timezone.now() > reset_token.expira_em:
        raise ValueError("Este link expirou. Solicite um novo.") from None

    reset_token.usuario.set_password(nova_senha)
    reset_token.usuario.save()
    reset_token.usado = True
    reset_token.save()
    return {"mensagem": "Senha redefinida com sucesso! Você já pode fazer login."}
