import secrets
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Escala, Especialidade, Medico, Municipio, RegistroTurno, TokenAtivacao, TokenRedefinicaoSenha, Turno, UPA, Usuario
from .permissions import IsGestorMunicipal, IsGestorUPA, IsMedico, IsSuperAdmin
from .serializers import (
    EscalaSerializer, EspecialidadeSerializer,
    MedBuscaTokenObtainPairSerializer, MedicoCriarSerializer, MedicoSerializer, MunicipioSerializer,
    TurnoSerializer, UPAPublicaSerializer, UPASerializer,
    UsuarioCriarSerializer, UsuarioSerializer,
)


class MedBuscaTokenObtainPairView(TokenObtainPairView):
    serializer_class = MedBuscaTokenObtainPairSerializer


# ─── Health ───────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'sistema': 'MedBusca API Django', 'versao': '2.0.0'})


# ─── Auth ─────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UsuarioSerializer(request.user).data)


# ─── Municípios ───────────────────────────────────────────────────────────────
class MunicipioListCreate(generics.ListCreateAPIView):
    serializer_class = MunicipioSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get_queryset(self):
        return Municipio.objects.filter(ativo=True)


class MunicipioDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Municipio.objects.all()
    serializer_class = MunicipioSerializer
    permission_classes = [IsSuperAdmin]

    def destroy(self, request, *args, **kwargs):
        municipio = self.get_object()
        municipio.ativo = False
        municipio.save()
        return Response({'mensagem': 'Município desativado com sucesso.'})


# ─── Especialidades ───────────────────────────────────────────────────────────
class EspecialidadeList(generics.ListAPIView):
    queryset = Especialidade.objects.all()
    serializer_class = EspecialidadeSerializer
    permission_classes = [AllowAny]


# ─── UPAs ─────────────────────────────────────────────────────────────────────
class UPAListCreate(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsGestorMunicipal()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UPASerializer
        especialidade_id = self.request.query_params.get('especialidade_id')
        municipio_id = self.request.query_params.get('municipio_id')
        if especialidade_id or municipio_id:
            return UPAPublicaSerializer
        return UPASerializer

    def get_queryset(self):
        qs = UPA.objects.filter(ativa=True).prefetch_related('especialidades', 'medicos')
        municipio_id = self.request.query_params.get('municipio_id')
        especialidade_id = self.request.query_params.get('especialidade_id')
        if municipio_id:
            qs = qs.filter(municipio_id=municipio_id)
        if especialidade_id:
            qs = qs.filter(medicos__especialidade_id=especialidade_id).distinct()
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['especialidade_id'] = self.request.query_params.get('especialidade_id')
        return ctx

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        especialidade_id = request.query_params.get('especialidade_id')
        if especialidade_id:
            upas = [u for u in qs if u.medicos.filter(especialidade_id=especialidade_id).exists()]
            serializer = UPAPublicaSerializer(upas, many=True, context=self.get_serializer_context())
        else:
            serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class UPADetail(generics.RetrieveUpdateAPIView):
    queryset = UPA.objects.all()
    serializer_class = UPASerializer
    permission_classes = [IsGestorMunicipal]


# ─── Médicos ──────────────────────────────────────────────────────────────────
class MedicoListCreate(generics.ListCreateAPIView):
    permission_classes = [IsGestorUPA]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicoCriarSerializer
        return MedicoSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Medico.objects.select_related('especialidade', 'upa').all()
        if user.perfil == 'gestor_upa':
            qs = qs.filter(upa=user.upa)
        elif user.perfil == 'gestor_municipal':
            qs = qs.filter(upa__municipio=user.municipio)
        upa_id = self.request.query_params.get('upa_id')
        if upa_id:
            qs = qs.filter(upa_id=upa_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = MedicoCriarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        medico = serializer.save()
        return Response(MedicoSerializer(medico).data, status=status.HTTP_201_CREATED)


class MedicoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medico.objects.all()
    serializer_class = MedicoSerializer
    permission_classes = [IsGestorUPA]


# ─── Escalas ──────────────────────────────────────────────────────────────────
class EscalaListCreate(generics.ListCreateAPIView):
    serializer_class = EscalaSerializer
    permission_classes = [IsGestorUPA]

    def get_queryset(self):
        user = self.request.user
        qs = Escala.objects.select_related('medico', 'medico__especialidade', 'upa').all()
        if user.perfil == 'gestor_upa':
            qs = qs.filter(upa=user.upa)
        elif user.perfil == 'gestor_municipal':
            qs = qs.filter(upa__municipio=user.municipio)
        data = self.request.query_params.get('data')
        if data:
            qs = qs.filter(data=data)
        return qs


class EscalaDelete(generics.DestroyAPIView):
    queryset = Escala.objects.all()
    permission_classes = [IsGestorUPA]


# ─── Turnos ───────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meu_turno(request):
    try:
        medico = request.user.medico
    except Exception:
        return Response({'erro': 'Médico não encontrado para este usuário.'}, status=404)
    turno = medico.turno_atual
    registros = turno.registros.all() if turno else []
    return Response({
        'medico': MedicoSerializer(medico).data,
        'turno': TurnoSerializer(turno).data if turno else None,
        'historico': [{'acao': r.acao, 'registrado_em': r.registrado_em} for r in registros],
    })


@api_view(['POST'])
@permission_classes([IsMedico])
def iniciar_turno(request):
    try:
        medico = request.user.medico
    except Exception:
        return Response({'erro': 'Médico não encontrado.'}, status=404)
    if medico.turno_atual:
        return Response({'erro': 'Já existe um turno em andamento.'}, status=400)
    turno = Turno.objects.create(medico=medico, status='em_atendimento')
    RegistroTurno.objects.create(turno=turno, acao='inicio')
    return Response(TurnoSerializer(turno).data, status=201)


@api_view(['POST'])
@permission_classes([IsMedico])
def pausar_turno(request):
    try:
        medico = request.user.medico
    except Exception:
        return Response({'erro': 'Médico não encontrado.'}, status=404)
    turno = medico.turnos.filter(status='em_atendimento').first()
    if not turno:
        return Response({'erro': 'Nenhum turno ativo para pausar.'}, status=400)
    turno.status = 'em_pausa'
    turno.save()
    RegistroTurno.objects.create(turno=turno, acao='pausa')
    return Response(TurnoSerializer(turno).data)


@api_view(['POST'])
@permission_classes([IsMedico])
def retornar_turno(request):
    try:
        medico = request.user.medico
    except Exception:
        return Response({'erro': 'Médico não encontrado.'}, status=404)
    turno = medico.turnos.filter(status='em_pausa').first()
    if not turno:
        return Response({'erro': 'Nenhum turno em pausa para retornar.'}, status=400)
    turno.status = 'em_atendimento'
    turno.save()
    RegistroTurno.objects.create(turno=turno, acao='retorno')
    return Response(TurnoSerializer(turno).data)


@api_view(['POST'])
@permission_classes([IsMedico])
def encerrar_turno(request):
    try:
        medico = request.user.medico
    except Exception:
        return Response({'erro': 'Médico não encontrado.'}, status=404)
    turno = medico.turnos.filter(status__in=['em_atendimento', 'em_pausa']).first()
    if not turno:
        return Response({'erro': 'Nenhum turno ativo para encerrar.'}, status=400)
    turno.status = 'encerrado'
    turno.encerrado_em = timezone.now()
    turno.save()
    RegistroTurno.objects.create(turno=turno, acao='encerramento')
    return Response(TurnoSerializer(turno).data)


@api_view(['GET'])
@permission_classes([IsGestorUPA])
def listar_turnos(request):
    user = request.user
    qs = Turno.objects.select_related('medico', 'medico__especialidade').prefetch_related('registros')
    if user.perfil == 'gestor_upa':
        qs = qs.filter(medico__upa=user.upa)
    elif user.perfil == 'gestor_municipal':
        qs = qs.filter(medico__upa__municipio=user.municipio)
    upa_id = request.query_params.get('upa_id')
    if upa_id:
        qs = qs.filter(medico__upa_id=upa_id)
    return Response(TurnoSerializer(qs, many=True).data)


# ─── Relatórios ───────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsGestorUPA])
def relatorio_upa(request, upa_id):
    try:
        upa = UPA.objects.get(pk=upa_id)
    except UPA.DoesNotExist:
        return Response({'erro': 'UPA não encontrada.'}, status=404)
    mes = request.query_params.get('mes')
    qs_turnos = Turno.objects.filter(medico__upa=upa)
    if mes:
        qs_turnos = qs_turnos.filter(iniciado_em__startswith=mes)
    medicos = upa.medicos.select_related('especialidade').all()
    total_horas = 0
    detalhamento = []
    for med in medicos:
        turnos_med = qs_turnos.filter(medico=med, status='encerrado')
        horas = sum(
            (t.encerrado_em - t.iniciado_em).total_seconds() / 3600
            for t in turnos_med if t.encerrado_em
        )
        total_horas += horas
        detalhamento.append({
            'id': med.id, 'nome': med.nome, 'especialidade': med.especialidade.nome,
            'total_horas': f'{round(horas)}h',
            'assiduidade': f'{min(98, 80 + turnos_med.count() * 3)}%',
            'status': 'Online' if med.turno_atual else 'Offline',
        })
    total_turnos = qs_turnos.count()
    encerrados = qs_turnos.filter(status='encerrado').count()
    taxa = round((encerrados / total_turnos) * 100) if total_turnos else 0
    return Response({
        'upa': {'id': upa.id, 'nome': upa.nome, 'bairro': upa.bairro},
        'mes': mes or 'todos',
        'medicos_ativos': medicos.count(),
        'total_horas': f'{round(total_horas)}h',
        'taxa_disponibilidade': f'{taxa}%',
        'detalhamento': detalhamento,
    })


@api_view(['GET'])
@permission_classes([IsGestorMunicipal])
def relatorio_municipio(request, municipio_id):
    try:
        municipio = Municipio.objects.get(pk=municipio_id)
    except Municipio.DoesNotExist:
        return Response({'erro': 'Município não encontrado.'}, status=404)
    upas = municipio.upas.all()
    dados = []
    for upa in upas:
        dados.append({
            'id': upa.id, 'nome': upa.nome, 'bairro': upa.bairro, 'ativa': upa.ativa,
            'total_medicos': upa.medicos.count(),
            'em_atendimento': Turno.objects.filter(medico__upa=upa, status='em_atendimento').count(),
        })
    return Response({
        'total_upas': upas.count(),
        'upas_ativas': upas.filter(ativa=True).count(),
        'total_medicos': Medico.objects.filter(upa__municipio=municipio).count(),
        'upas': dados,
    })


# ─── Ativação de Conta ────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def verificar_token_ativacao(request, token):
    try:
        t = TokenAtivacao.objects.get(token=token, usado=False)
    except TokenAtivacao.DoesNotExist:
        return Response({'erro': 'Link inválido ou já utilizado.'}, status=400)
    if timezone.now() > t.expira_em:
        return Response({'erro': 'Este link expirou. Solicite um novo ao administrador.'}, status=400)
    return Response({'nome': t.usuario.nome, 'email': t.usuario.email})


@api_view(['POST'])
@permission_classes([AllowAny])
def ativar_conta(request):
    token_str = request.data.get('token')
    senha = request.data.get('senha')
    if not token_str or not senha:
        return Response({'erro': 'Token e senha são obrigatórios.'}, status=400)
    if len(senha) < 6:
        return Response({'erro': 'A senha deve ter pelo menos 6 caracteres.'}, status=400)
    try:
        t = TokenAtivacao.objects.get(token=token_str, usado=False)
    except TokenAtivacao.DoesNotExist:
        return Response({'erro': 'Link inválido ou já utilizado.'}, status=400)
    if timezone.now() > t.expira_em:
        return Response({'erro': 'Este link expirou.'}, status=400)
    t.usuario.set_password(senha)
    t.usuario.save()
    t.usado = True
    t.save()
    return Response({'mensagem': 'Senha criada com sucesso! Você já pode fazer login.'})


# ─── Recuperação de Senha ─────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def esqueci_senha(request):
    """Gera token de redefinição e envia email. Resposta sempre 200 (não vaza existência do email)."""
    from .email_service import enviar_email_redefinicao_senha
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'erro': 'Email é obrigatório.'}, status=400)
    try:
        usuario = Usuario.objects.get(email=email, is_active=True)
    except Usuario.DoesNotExist:
        # Retorna 200 mesmo assim — não revela se o email existe
        return Response({'mensagem': 'Se este email estiver cadastrado, você receberá um link em breve.'})
    # Invalida tokens anteriores não usados do mesmo usuário
    TokenRedefinicaoSenha.objects.filter(usuario=usuario, usado=False).update(usado=True)
    token_str = secrets.token_urlsafe(48)
    TokenRedefinicaoSenha.objects.create(
        usuario=usuario,
        token=token_str,
        expira_em=timezone.now() + timedelta(hours=1),
    )
    enviar_email_redefinicao_senha(usuario.nome, usuario.email, token_str)
    return Response({'mensagem': 'Se este email estiver cadastrado, você receberá um link em breve.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def redefinir_senha(request):
    token_str = request.data.get('token', '').strip()
    nova_senha = request.data.get('nova_senha', '')
    if not token_str or not nova_senha:
        return Response({'erro': 'Token e nova senha são obrigatórios.'}, status=400)
    if len(nova_senha) < 6:
        return Response({'erro': 'A senha deve ter pelo menos 6 caracteres.'}, status=400)
    try:
        t = TokenRedefinicaoSenha.objects.get(token=token_str, usado=False)
    except TokenRedefinicaoSenha.DoesNotExist:
        return Response({'erro': 'Link inválido ou já utilizado.'}, status=400)
    if timezone.now() > t.expira_em:
        return Response({'erro': 'Este link expirou. Solicite um novo.'}, status=400)
    t.usuario.set_password(nova_senha)
    t.usuario.save()
    t.usado = True
    t.save()
    return Response({'mensagem': 'Senha redefinida com sucesso! Você já pode fazer login.'})


# ─── Usuários ─────────────────────────────────────────────────────────────────
class UsuarioListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UsuarioCriarSerializer
        return UsuarioSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Usuario.objects.filter(is_active=True).exclude(perfil='super_admin')
        # Gestor municipal só vê usuários do seu município
        if user.perfil == 'gestor_municipal' and user.municipio_id:
            qs = qs.filter(municipio=user.municipio)
        # Gestor de UPA só vê médicos da sua UPA
        elif user.perfil == 'gestor_upa' and user.upa_id:
            qs = qs.filter(upa=user.upa)
        perfil = self.request.query_params.get('perfil')
        if perfil:
            qs = qs.filter(perfil=perfil)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = UsuarioCriarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        return Response(UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsGestorMunicipal])
def desativar_usuario(request, pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado.'}, status=404)
    usuario.is_active = False
    # Libera o e-mail para reutilização futura
    usuario.email = f'__inativo_{usuario.pk}__{usuario.email}'
    usuario.save()
    return Response({'mensagem': 'Usuário desativado.'})
