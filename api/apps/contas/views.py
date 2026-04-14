from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.apps.contas.services import activate_account, get_activation_token_data, request_password_reset, reset_password


@api_view(["GET"])
@permission_classes([AllowAny])
def verificar_token_ativacao(request, token):
    try:
        return Response(get_activation_token_data(token))
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def ativar_conta(request):
    try:
        return Response(activate_account(request.data.get("token"), request.data.get("senha")))
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def esqueci_senha(request):
    try:
        return Response(request_password_reset(request.data.get("email")))
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def redefinir_senha(request):
    try:
        return Response(reset_password(request.data.get("token"), request.data.get("nova_senha")))
    except ValueError as exc:
        return Response({"erro": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
