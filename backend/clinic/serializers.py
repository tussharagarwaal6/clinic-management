from rest_framework import serializers

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
            'created_at',
        ]
        read_only_fields = ['created_at']
