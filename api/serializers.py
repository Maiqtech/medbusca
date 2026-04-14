import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import TokenAtivacao, Usuario, Municipio, Especialidade, UPA, Medico, Escala, Turno, RegistroTurno


class MedBuscaTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['perfil'] = user.perfil
        token['nome'] = user.nome
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuario'] = {
            'id': self.user.id,
            'nome': self.user.nome,
            'email': self.user.email,
            'perfil': self.user.perfil,
            'municipio_id': self.user.municipio_id,
            'municipio_nome': self.user.municipio.nome if self.user.municipio else None,
            'upa_id': self.user.upa_id,
            'upa_nome': self.user.upa.nome if self.user.upa else None,
        }
        return data


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'perfil', 'municipio', 'upa', 'is_active', 'criado_em']
        read_only_fields = ['id', 'criado_em']


class UsuarioCriarSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = ['nome', 'email', 'perfil', 'senha', 'municipio', 'upa']

    def create(self, validated_data):
        from .email_service import enviar_email_ativacao
        senha = validated_data.pop('senha', None)
        user = Usuario(**validated_data)
        if senha:
            user.set_password(senha)
        else:
            user.set_unusable_password()
        user.save()

        # Gera token de ativação e envia e-mail para gestores
        if user.perfil in ('gestor_municipal', 'gestor_upa'):
            token_str = secrets.token_urlsafe(48)
            TokenAtivacao.objects.create(
                usuario=user,
                token=token_str,
                expira_em=timezone.now() + timedelta(hours=24),
            )
            contexto = ''
            if user.perfil == 'gestor_municipal' and user.municipio:
                contexto = f'Você é responsável pelo município de {user.municipio.nome}/{user.municipio.uf}'
            elif user.perfil == 'gestor_upa' and user.upa:
                contexto = f'Você é responsável pela {user.upa.nome}'
            enviar_email_ativacao(user.nome, user.email, token_str,
                                  perfil=user.perfil, contexto=contexto)

        return user


class MunicipioSerializer(serializers.ModelSerializer):
    total_upas = serializers.SerializerMethodField()
    total_gestores = serializers.SerializerMethodField()
    total_medicos = serializers.SerializerMethodField()
    unidades_ativas = serializers.SerializerMethodField()

    class Meta:
        model = Municipio
        fields = ['id', 'nome', 'uf', 'logo_url', 'ativo', 'criado_em',
                  'total_upas', 'total_gestores', 'total_medicos', 'unidades_ativas']
        read_only_fields = ['id', 'criado_em']

    def get_total_upas(self, obj):
        return obj.upas.count()

    def get_total_gestores(self, obj):
        return Usuario.objects.filter(
            is_active=True, perfil='gestor_municipal', municipio=obj
        ).count()

    def get_total_medicos(self, obj):
        return Medico.objects.filter(upa__municipio=obj).count()

    def get_unidades_ativas(self, obj):
        return obj.upas.filter(ativa=True).count()


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = ['id', 'nome']


class UPASerializer(serializers.ModelSerializer):
    especialidades = serializers.SerializerMethodField()
    municipio_nome = serializers.CharField(source='municipio.nome', read_only=True)
    municipio_uf = serializers.CharField(source='municipio.uf', read_only=True)
    total_medicos = serializers.SerializerMethodField()
    em_atendimento = serializers.SerializerMethodField()
    em_pausa = serializers.SerializerMethodField()
    encerrados = serializers.SerializerMethodField()

    class Meta:
        model = UPA
        fields = ['id', 'nome', 'endereco', 'bairro', 'municipio', 'municipio_nome', 'municipio_uf',
                  'latitude', 'longitude',
                  'especialidades', 'ativa', 'criado_em',
                  'total_medicos', 'em_atendimento', 'em_pausa', 'encerrados']
        read_only_fields = ['id', 'criado_em']

    def get_especialidades(self, obj):
        esp_ids = obj.medicos.values_list('especialidade_id', flat=True).distinct()
        return EspecialidadeSerializer(
            Especialidade.objects.filter(id__in=esp_ids), many=True
        ).data

    def get_total_medicos(self, obj):
        return obj.medicos.count()

    def get_em_atendimento(self, obj):
        return Turno.objects.filter(medico__upa=obj, status='em_atendimento').count()

    def get_em_pausa(self, obj):
        return Turno.objects.filter(medico__upa=obj, status='em_pausa').count()

    def get_encerrados(self, obj):
        from django.utils import timezone
        hoje = timezone.now().date()
        return Turno.objects.filter(medico__upa=obj, status='encerrado', iniciado_em__date=hoje).count()


class UPAPublicaSerializer(serializers.ModelSerializer):
    """Serializer para o portal público — sem dados sensíveis."""
    especialidades = serializers.SerializerMethodField()
    municipio_nome = serializers.CharField(source='municipio.nome', read_only=True)

    def get_especialidades(self, obj):
        esp_ids = obj.medicos.values_list('especialidade_id', flat=True).distinct()
        return EspecialidadeSerializer(
            Especialidade.objects.filter(id__in=esp_ids), many=True
        ).data
    status_especialidade = serializers.SerializerMethodField()

    class Meta:
        model = UPA
        fields = ['id', 'nome', 'bairro', 'municipio_nome', 'especialidades',
                  'status_especialidade', 'latitude', 'longitude']

    def get_status_especialidade(self, obj):
        especialidade_id = self.context.get('especialidade_id')
        if not especialidade_id:
            return None

        try:
            from django.utils import timezone
            from datetime import datetime

            medicos = obj.medicos.filter(especialidade_id=especialidade_id)
            if not medicos.exists():
                return {'disponivel': False, 'proximo_turno': None}

            # Verifica se algum médico tem turno ativo agora
            for medico in medicos:
                if medico.turnos.filter(status='em_atendimento').exists():
                    return {'disponivel': True, 'proximo_turno': None}

            # Nenhum ativo — busca a próxima escala entre todos os médicos
            agora = timezone.now()
            proxima = None
            for medico in medicos:
                escala = medico.escalas.filter(
                    data__gte=agora.date()
                ).order_by('data', 'hora_inicio').first()
                if escala:
                    if proxima is None or (escala.data, escala.hora_inicio) < (proxima.data, proxima.hora_inicio):
                        proxima = escala

            proximo_str = None
            if proxima:
                dias_diff = (proxima.data - agora.date()).days
                hora_fmt = proxima.hora_inicio.strftime("%H:%M")
                if dias_diff == 0:
                    hora_inicio = datetime.combine(proxima.data, proxima.hora_inicio)
                    if hora_inicio.replace(tzinfo=agora.tzinfo) > agora:
                        proximo_str = f'hoje às {hora_fmt}'
                elif dias_diff == 1:
                    proximo_str = f'amanhã às {hora_fmt}'
                else:
                    proximo_str = f'{proxima.data.strftime("%d/%m")} às {hora_fmt}'

            return {'disponivel': False, 'proximo_turno': proximo_str}
        except Exception:
            return {'disponivel': False, 'proximo_turno': None}


class MedicoSerializer(serializers.ModelSerializer):
    especialidade_nome = serializers.CharField(source='especialidade.nome', read_only=True)
    upa_nome = serializers.CharField(source='upa.nome', read_only=True)
    status_turno = serializers.SerializerMethodField()
    turno_iniciado_em = serializers.SerializerMethodField()

    class Meta:
        model = Medico
        fields = ['id', 'nome', 'crm', 'especialidade', 'especialidade_nome',
                  'upa', 'upa_nome', 'criado_em', 'status_turno', 'turno_iniciado_em']
        read_only_fields = ['id', 'criado_em']

    def get_status_turno(self, obj):
        turno = obj.turno_atual
        return turno.status if turno else 'offline'

    def get_turno_iniciado_em(self, obj):
        turno = obj.turno_atual
        return turno.iniciado_em if turno else None


class MedicoCriarSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    senha = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Medico
        fields = ['nome', 'crm', 'especialidade', 'upa', 'email', 'senha']

    def validate_crm(self, value):
        if Medico.objects.filter(crm=value).exists():
            raise serializers.ValidationError('CRM já cadastrado.')
        return value

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        senha = validated_data.pop('senha', None)

        usuario = None
        if email:
            if Usuario.objects.filter(email=email, is_active=True).exists():
                raise serializers.ValidationError({'email': 'E-mail já cadastrado.'})
            usuario = Usuario.objects.create_user(
                email=email, nome=validated_data['nome'],
                perfil='medico', senha=senha or secrets.token_urlsafe(12),
                upa=validated_data.get('upa')
            )

        medico = Medico.objects.create(usuario=usuario, **validated_data)

        if usuario and email:
            from .email_service import enviar_email_ativacao
            token_str = secrets.token_urlsafe(48)
            TokenAtivacao.objects.create(
                usuario=usuario,
                token=token_str,
                expira_em=timezone.now() + timedelta(hours=24),
            )
            upa_nome = medico.upa.nome if medico.upa else ''
            esp_nome = medico.especialidade.nome if medico.especialidade else ''
            contexto = f'Especialidade: {esp_nome}'
            if upa_nome:
                contexto += f' — {upa_nome}'
            enviar_email_ativacao(usuario.nome, email, token_str,
                                  perfil='medico', contexto=contexto)

        return medico


class EscalaSerializer(serializers.ModelSerializer):
    medico_nome = serializers.CharField(source='medico.nome', read_only=True)
    especialidade_nome = serializers.CharField(source='medico.especialidade.nome', read_only=True)
    upa_nome = serializers.CharField(source='upa.nome', read_only=True)

    class Meta:
        model = Escala
        fields = ['id', 'medico', 'medico_nome', 'especialidade_nome',
                  'upa', 'upa_nome', 'data', 'hora_inicio', 'hora_fim', 'criado_em']
        read_only_fields = ['id', 'criado_em', 'upa']

    def create(self, validated_data):
        validated_data['upa'] = validated_data['medico'].upa
        return super().create(validated_data)


class RegistroTurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroTurno
        fields = ['id', 'acao', 'registrado_em']


class TurnoSerializer(serializers.ModelSerializer):
    medico_nome = serializers.CharField(source='medico.nome', read_only=True)
    especialidade_nome = serializers.CharField(source='medico.especialidade.nome', read_only=True)
    registros = RegistroTurnoSerializer(many=True, read_only=True)

    class Meta:
        model = Turno
        fields = ['id', 'medico', 'medico_nome', 'especialidade_nome',
                  'status', 'iniciado_em', 'encerrado_em', 'registros']
        read_only_fields = ['id', 'iniciado_em', 'encerrado_em', 'status']
