from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Doctor, Patient

User = get_user_model()
DOCTORS_GROUP_NAME = 'Doctors'
DEFAULT_DOCTOR_PASSWORD = 'pass123'


def ensure_doctors_group():
    group, _ = Group.objects.get_or_create(name=DOCTORS_GROUP_NAME)
    return group


@receiver(post_save, sender=Doctor)
def create_doctor_user(sender, instance, created, **kwargs):
    if not created or instance.user_id:
        return

    password = DEFAULT_DOCTOR_PASSWORD
    user = User.objects.create_user(
        username=instance.email,
        email=instance.email,
        password=password,
        first_name=instance.name,
        is_staff=False,
    )
    user.groups.add(ensure_doctors_group())
    Doctor.objects.filter(pk=instance.pk).update(user=user)
    instance.user = user
    instance._generated_password = password


@receiver(post_save, sender=Patient)
def assign_patient_uhid(sender, instance, created, **kwargs):
    if created and not instance.uhid:
        uhid = f'UHID{instance.pk:06d}'
        Patient.objects.filter(pk=instance.pk).update(uhid=uhid)
        instance.uhid = uhid
