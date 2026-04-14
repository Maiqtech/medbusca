from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from api.apps.auth.services import build_authenticated_user_payload, build_health_payload
from api.serializers import MedBuscaTokenObtainPairSerializer


class MedBuscaTokenObtainPairView(TokenObtainPairView):
    serializer_class = MedBuscaTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response(build_health_payload())


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(build_authenticated_user_payload(request.user))
