from django.core.mail import send_mail
from django.conf import settings


_PERFIL_LABELS = {
    'gestor_municipal': 'Gestor Municipal',
    'gestor_upa': 'Gestor de UPA',
    'medico': 'Médico',
}


def enviar_email_ativacao(nome: str, email: str, token: str, perfil: str = 'gestor_municipal',
                          contexto: str = ''):
    """
    contexto: texto extra de contexto, ex:
      - gestor_municipal: "responsável pelo município de Salvador/BA"
      - gestor_upa: "responsável pela UPA 24h Hélio Machado"
      - medico: "especialidade Cardiologia na UPA 24h Hélio Machado"
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    link = f'{frontend_url}/?token={token}'

    cargo = _PERFIL_LABELS.get(perfil, 'colaborador')
    contexto_html = f'<br>{contexto}.' if contexto else ''

    html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
              Med<span style="opacity:0.7;">Busca</span>
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Plataforma Pública de Saúde</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Olá, {nome}!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              Você foi cadastrado como <strong style="color:#0f172a;">{cargo}</strong>
              no sistema <strong>MedBusca</strong>.{contexto_html}<br><br>
              Clique no botão abaixo para criar sua senha e ativar seu acesso.
            </p>
            <a href="{link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:16px 32px;border-radius:14px;">
              Criar minha senha
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
              Este link expira em <strong>24 horas</strong>. Se não reconhece este e-mail, ignore-o.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
              MedBusca • Secretaria Municipal de Saúde
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
'''

    try:
        send_mail(
            subject=f'Bem-vindo ao MedBusca — {cargo}',
            message=f'Olá {nome}, você foi cadastrado como {cargo}. Acesse o link para criar sua senha: {link}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f'[EMAIL ERROR] {e}')
        return False


def enviar_email_redefinicao_senha(nome: str, email: str, token: str):
    """Envia email com link para redefinição de senha. Válido por 1 hora."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    link = f'{frontend_url}/?reset_token={token}'

    html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
              Med<span style="opacity:0.7;">Busca</span>
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Plataforma Pública de Saúde</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Olá, {nome}!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              Recebemos uma solicitação de redefinição de senha para sua conta no
              <strong>MedBusca</strong>.<br><br>
              Clique no botão abaixo para criar uma nova senha.
            </p>
            <a href="{link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:16px 32px;border-radius:14px;">
              Redefinir minha senha
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
              Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
              MedBusca • Secretaria Municipal de Saúde
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
'''

    try:
        send_mail(
            subject='MedBusca — Redefinição de senha',
            message=f'Olá {nome}, clique no link para redefinir sua senha: {link}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f'[EMAIL ERROR] {e}')
        return False
