from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil == 'super_admin'


class IsGestorMunicipal(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in ['gestor_municipal', 'super_admin']


class IsGestorUPA(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in ['gestor_upa', 'gestor_municipal', 'super_admin']


class IsMedico(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil == 'medico'


class IsProfissional(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
