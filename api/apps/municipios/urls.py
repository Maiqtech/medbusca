from django.urls import path

from api.apps.municipios.views import MunicipioDetail, MunicipioListCreate

urlpatterns = [
    path("", MunicipioListCreate.as_view()),
    path("<int:pk>/", MunicipioDetail.as_view()),
]
