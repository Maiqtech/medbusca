from django.urls import path

from api.apps.medicos.views import MedicoDetail, MedicoListCreate

urlpatterns = [
    path("", MedicoListCreate.as_view()),
    path("<int:pk>/", MedicoDetail.as_view()),
]
