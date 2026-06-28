import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { Appointment, AppointmentStatus, Doctor, Patient } from '../../core/models/clinic.models';
import { AppointmentFormDialogComponent } from './appointment-form-dialog.component';
import {
  AppointmentActionDialogComponent,
} from './appointment-action-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    FullCalendarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements OnInit {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  doctors: Doctor[] = [];
  patients: Patient[] = [];
  selectedDoctorId: number | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay,dayGridMonth',
    },
    editable: true,
    selectable: false,
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00:00',
    allDaySlot: false,
    height: 'auto',
    events: [],
    dateClick: (info) => this.handleDateClick(info),
    eventClick: (info) => this.handleEventClick(info),
    eventDrop: (info) => this.handleEventDrop(info),
  };

  ngOnInit(): void {
    this.doctorService.list().subscribe((doctors) => {
      this.doctors = doctors;
      if (doctors.length > 0) {
        this.selectedDoctorId = doctors[0].id;
        this.loadCalendarEvents();
      }
    });
    this.patientService.list().subscribe((patients) => {
      this.patients = patients;
    });
  }

  onDoctorChange(doctorId: number): void {
    this.selectedDoctorId = doctorId;
    this.loadCalendarEvents();
  }

  loadCalendarEvents(): void {
    if (!this.selectedDoctorId) {
      this.calendarOptions = { ...this.calendarOptions, events: [] };
      return;
    }

    this.appointmentService.list({ doctor: this.selectedDoctorId }).subscribe((appointments) => {
      const events = this.mapAppointmentsToEvents(appointments);
      this.calendarOptions = {
        ...this.calendarOptions,
        events,
      };
      this.navigateToEarliestAppointment(appointments);
    });
  }

  private navigateToEarliestAppointment(appointments: Appointment[]): void {
    if (appointments.length === 0) {
      return;
    }

    const sorted = [...appointments].sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    );
    const targetDate = sorted[0].date;

    queueMicrotask(() => {
      this.calendarComponent?.getApi()?.gotoDate(targetDate);
    });
  }

  private mapAppointmentsToEvents(appointments: Appointment[]): EventInput[] {
    return appointments.map((appointment) => {
      const time = this.normalizeTime(appointment.time);
      const start = `${appointment.date}T${time}`;
      const startDate = new Date(start);
      const durationMinutes = appointment.duration_minutes ?? 15;
      const end = this.toLocalDateTime(
        new Date(startDate.getTime() + durationMinutes * 60000),
      );

      return {
        id: String(appointment.id),
        title: appointment.patient_name,
        start,
        end,
        backgroundColor: this.statusColor(appointment.status),
        borderColor: this.statusColor(appointment.status),
        extendedProps: { appointment },
      };
    });
  }

  private normalizeTime(time: string): string {
    const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.slice(0, 2).padStart(2, '0')}`;
  }

  private toLocalDateTime(value: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private statusColor(status: AppointmentStatus): string {
    switch (status) {
      case 'Completed':
        return '#16a34a';
      case 'Cancelled':
        return '#dc2626';
      default:
        return '#1e6fb8';
    }
  }

  private handleDateClick(info: DateClickArg): void {
    if (!this.selectedDoctorId) {
      this.snackBar.open('Please select a doctor first.', 'Close', { duration: 3000 });
      return;
    }

    const date = info.dateStr.slice(0, 10);
    const time = info.date.toTimeString().slice(0, 5);

    const ref = this.dialog.open(AppointmentFormDialogComponent, {
      width: '520px',
      data: {
        doctors: this.doctors,
        patients: this.patients,
        prefilledDate: date,
        prefilledTime: time,
        lockedDoctorId: this.selectedDoctorId,
      },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.appointmentService.create(payload).subscribe({
        next: () => this.loadCalendarEvents(),
        error: (error) => this.handleAppointmentError(error),
      });
    });
  }

  private handleEventClick(info: EventClickArg): void {
    const appointment = info.event.extendedProps['appointment'] as Appointment;
    const ref = this.dialog.open(AppointmentActionDialogComponent, {
      width: '420px',
      data: { appointment },
    });

    ref.afterClosed().subscribe((action) => {
      if (!action) return;

      if (action === 'edit') {
        this.openEditDialog(appointment);
        return;
      }

      if (action === 'complete') {
        this.appointmentService.patch(appointment.id, { status: 'Completed' }).subscribe({
          next: () => this.loadCalendarEvents(),
          error: (error) => this.handleAppointmentError(error),
        });
        return;
      }

      if (action === 'cancel') {
        this.appointmentService.patch(appointment.id, { status: 'Cancelled' }).subscribe({
          next: () => this.loadCalendarEvents(),
          error: (error) => this.handleAppointmentError(error),
        });
        return;
      }

      if (action === 'delete') {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Delete Appointment',
            message: `Delete appointment for ${appointment.patient_name}?`,
          },
        });
        confirmRef.afterClosed().subscribe((confirmed) => {
          if (!confirmed) return;
          this.appointmentService.delete(appointment.id).subscribe({
            next: () => this.loadCalendarEvents(),
            error: (error) => this.handleAppointmentError(error),
          });
        });
      }
    });
  }

  private openEditDialog(appointment: Appointment): void {
    const ref = this.dialog.open(AppointmentFormDialogComponent, {
      width: '520px',
      data: {
        appointment,
        doctors: this.doctors,
        patients: this.patients,
        lockedDoctorId: this.selectedDoctorId ?? appointment.doctor,
      },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.appointmentService.update(appointment.id, payload).subscribe({
        next: () => this.loadCalendarEvents(),
        error: (error) => this.handleAppointmentError(error),
      });
    });
  }

  private handleEventDrop(info: EventDropArg): void {
    const appointment = info.event.extendedProps['appointment'] as Appointment;
    if (!info.event.start) {
      info.revert();
      return;
    }

    const { date, time } = this.extractDateTime(info.event.start);
    this.appointmentService.patch(appointment.id, { date, time }).subscribe({
      next: () => this.loadCalendarEvents(),
      error: (error) => {
        info.revert();
        this.handleAppointmentError(error);
      },
    });
  }

  private extractDateTime(value: Date): { date: string; time: string } {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:00`,
    };
  }

  private handleAppointmentError(error: unknown): void {
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      const message = this.extractErrorMessage(error);
      this.snackBar.open(
        message ?? 'This slot is already booked for the selected doctor. Please choose a different time.',
        'Close',
        { duration: 5000 },
      );
      return;
    }
    this.snackBar.open('Unable to save appointment. Please try again.', 'Close', { duration: 4000 });
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    const body = error.error;
    if (typeof body === 'string') {
      return body;
    }
    if (Array.isArray(body) && typeof body[0] === 'string') {
      return body[0];
    }
    if (body && typeof body === 'object') {
      const nonFieldErrors = (body as { non_field_errors?: string[] }).non_field_errors;
      if (nonFieldErrors?.[0]) {
        return nonFieldErrors[0];
      }
      const detail = (body as { detail?: string }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return null;
  }
}
