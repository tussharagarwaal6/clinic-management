from django_filters import FilterSet
from django_filters.rest_framework import CharFilter, DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.generics import ListAPIView

from .models import Appointment, Doctor, Patient
from .permissions import IsDoctor, IsStaff, IsStaffOrDoctorReadOnly
from .serializers import AppointmentSerializer, DoctorSerializer, PatientSerializer


class AppointmentFilter(FilterSet):
    patient = CharFilter(field_name='patient__uhid')

    class Meta:
        model = Appointment
        fields = ['status', 'doctor', 'patient']


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('user').all()
    serializer_class = DoctorSerializer
    permission_classes = [IsStaff]


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsStaff]
    lookup_field = 'uhid'


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('doctor', 'patient').all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsStaffOrDoctorReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AppointmentFilter

    def get_queryset(self):
        queryset = Appointment.objects.select_related('doctor', 'patient')
        user = self.request.user

        if user.is_staff:
            return queryset

        if hasattr(user, 'doctor'):
            return queryset.filter(doctor__user=user)

        return queryset.none()


class DoctorMyAppointmentsView(ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return (
            Appointment.objects
            .select_related('doctor', 'patient')
            .filter(doctor=self.request.user.doctor)
            .order_by('-date', '-time')
        )
