from django.urls import path

from api.apps.upas.views import UPADetail, UPAListCreate, upa_disponibilidade

urlpatterns = [
    path("", UPAListCreate.as_view()),
    path("<int:pk>/", UPADetail.as_view()),
    path("<int:pk>/disponibilidade/", upa_disponibilidade),
]
