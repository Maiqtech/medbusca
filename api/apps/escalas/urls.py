from django.urls import path

from api.apps.escalas.views import EscalaDelete, EscalaListCreate

urlpatterns = [
    path("", EscalaListCreate.as_view()),
    path("<int:pk>/", EscalaDelete.as_view()),
]
