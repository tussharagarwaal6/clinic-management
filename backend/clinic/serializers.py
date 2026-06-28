from datetime import datetime, timedelta

from rest_framework import serializers

from .constants import APPOINTMENT_DURATION_MINUTES
from .models import Appointment, Doctor, Patient


class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    generated_password = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id',
            'name',
            'email',
            'specialization',
            'username',
            'generated_password',
        ]
        read_only_fields = ['username', 'generated_password']

    def get_generated_password(self, obj):
        return getattr(obj, '_generated_password', None)


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'uhid', 'name', 'email', 'phone']
        read_only_fields = ['uhid']


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    patient = serializers.SlugRelatedField(
        slug_field='uhid',
        queryset=Patient.objects.all(),
    )

    class Meta:
        model = Appointment
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'patient',
            'patient_name',
            'date',
            'time',
            'status',
            'duration_minutes',
            'created_at',
        ]
        read_only_fields = ['created_at', 'duration_minutes']

    def get_duration_minutes(self, obj):
        return APPOINTMENT_DURATION_MINUTES

    def validate(self, attrs):
        instance = self.instance
        doctor = attrs.get('doctor') or (instance.doctor if instance else None)
        date = attrs.get('date') or (instance.date if instance else None)
        time = attrs.get('time') or (instance.time if instance else None)

        if not all([doctor, date, time]):
            return attrs

        duration = timedelta(minutes=APPOINTMENT_DURATION_MINUTES)

        new_start = datetime.combine(date, time)
        new_end = new_start + duration

        conflicts = Appointment.objects.filter(
            doctor=doctor,
            date=date,
            status=Appointment.Status.SCHEDULED,
        ).exclude(pk=getattr(instance, 'pk', None))

        for existing in conflicts:
            ex_start = datetime.combine(existing.date, existing.time)
            ex_end = ex_start + duration
            if new_start < ex_end and ex_start < new_end:
                raise serializers.ValidationError(
                    'This slot overlaps with an existing appointment.'
                )
        return attrs


class MeSerializer(serializers.Serializer):
    username = serializers.CharField()
    is_staff = serializers.BooleanField()
    role = serializers.CharField()
    doctor_id = serializers.IntegerField(allow_null=True)
    doctor_name = serializers.CharField(allow_null=True)


class DashboardStatsSerializer(serializers.Serializer):
    doctors = serializers.IntegerField()
    patients = serializers.IntegerField()
    appointments_total = serializers.IntegerField()
    appointments_scheduled = serializers.IntegerField()
    appointments_completed = serializers.IntegerField()
    appointments_cancelled = serializers.IntegerField()
