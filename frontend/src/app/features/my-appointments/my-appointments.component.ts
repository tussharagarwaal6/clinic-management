import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../core/models/clinic.models';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.scss',
})
export class MyAppointmentsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly snackBar = inject(MatSnackBar);

  appointments: Appointment[] = [];
  displayedColumns = ['patient_name', 'patient', 'date', 'time', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.appointmentService.listMy().subscribe((appointments) => {
      this.appointments = appointments;
    });
  }

  markCompleted(appointment: Appointment): void {
    this.appointmentService.completeMy(appointment.id).subscribe({
      next: () => {
        this.load();
        this.snackBar.open('Appointment marked as completed.', 'Close', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('Unable to mark appointment as completed.', 'Close', { duration: 4000 });
      },
    });
  }

  statusClass(status: AppointmentStatus): string {
    return `status-pill status-${status.toLowerCase()}`;
  }
}
