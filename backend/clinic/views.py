from django.shortcuts import get_object_or_404
from django_filters import FilterSet
from django_filters.rest_framework import CharFilter, DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import DOCTOR_SPECIALIZATIONS
from .models import Appointment, Doctor, Patient
from .permissions import IsDoctor, IsStaff, IsStaffOrDoctorReadOnly
from .serializers import (
    AppointmentSerializer,
    DashboardStatsSerializer,
    DoctorSerializer,
    MeSerializer,
    PatientSerializer,
)


class AppointmentFilter(FilterSet):
    patient = CharFilter(field_name='patient__uhid')

    class Meta:
        model = Appointment
        fields = ['status', 'doctor', 'patient']


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('user').all()
    serializer_class = DoctorSerializer
    permission_classes = [IsStaff]

    @action(detail=False, methods=['get'], url_path='specializations')
    def specializations(self, request):
        return Response(DOCTOR_SPECIALIZATIONS)


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


class DoctorCompleteAppointmentView(APIView):
    permission_classes = [IsDoctor]

    def post(self, request, pk):
        appointment = get_object_or_404(
            Appointment.objects.select_related('doctor', 'patient'),
            pk=pk,
            doctor=request.user.doctor,
        )

        if appointment.status != Appointment.Status.SCHEDULED:
            return Response(
                {'detail': 'Only scheduled appointments can be marked as completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = Appointment.Status.COMPLETED
        appointment.save(update_fields=['status'])

        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)


def build_me_payload(user):
    role = 'unknown'
    doctor_id = None
    doctor_name = None

    if user.is_staff:
        role = 'admin'
    elif hasattr(user, 'doctor'):
        role = 'doctor'
        doctor_id = user.doctor.id
        doctor_name = user.doctor.name

    return {
        'username': user.username,
        'is_staff': user.is_staff,
        'role': role,
        'doctor_id': doctor_id,
        'doctor_name': doctor_name,
    }


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(build_me_payload(request.user))
        return Response(serializer.data)


class DashboardStatsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        stats = {
            'doctors': Doctor.objects.count(),
            'patients': Patient.objects.count(),
            'appointments_total': Appointment.objects.count(),
            'appointments_scheduled': Appointment.objects.filter(
                status=Appointment.Status.SCHEDULED,
            ).count(),
            'appointments_completed': Appointment.objects.filter(
                status=Appointment.Status.COMPLETED,
            ).count(),
            'appointments_cancelled': Appointment.objects.filter(
                status=Appointment.Status.CANCELLED,
            ).count(),
        }
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
