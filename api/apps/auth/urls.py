from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from api.apps.auth import views

urlpatterns = [
    path("health/", views.health),
    path("auth/login/", views.MedBuscaTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("auth/me/", views.me),
]
