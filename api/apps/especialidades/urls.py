from django.urls import path

from api.apps.especialidades.views import EspecialidadeList

urlpatterns = [
    path("", EspecialidadeList.as_view()),
]
