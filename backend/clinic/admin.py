from django.contrib import admin, messages

from .models import Appointment, Doctor, Patient


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'specialization', 'user')
    search_fields = ('name', 'email', 'specialization', 'user__username')
    readonly_fields = ('user',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        generated_password = getattr(obj, '_generated_password', None)
        if generated_password:
            messages.success(
                request,
                f'Doctor login created. Username: {obj.email} | Password: {generated_password}',
            )


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('uhid', 'name', 'email', 'phone')
    search_fields = ('uhid', 'name', 'email', 'phone')
    readonly_fields = ('uhid',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'date', 'time', 'status', 'created_at')
    list_filter = ('status', 'date')
    search_fields = ('doctor__name', 'patient__name')
    date_hierarchy = 'date'
