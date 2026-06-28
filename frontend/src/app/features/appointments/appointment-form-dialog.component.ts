import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Appointment, AppointmentStatus, Doctor, Patient } from '../../core/models/clinic.models';

export interface AppointmentDialogData {
  appointment?: Appointment;
  doctors: Doctor[];
  patients: Patient[];
  prefilledDate?: string;
  prefilledTime?: string;
  lockedDoctorId?: number;
}

@Component({
  selector: 'app-appointment-form-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.appointment ? 'Edit Appointment' : 'Schedule Appointment' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Doctor</mat-label>
          <mat-select formControlName="doctor">
            @for (doctor of data.doctors; track doctor.id) {
              <mat-option [value]="doctor.id">{{ doctor.name }} ({{ doctor.specialization }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Patient (UHID)</mat-label>
          <mat-select formControlName="patient">
            @for (patient of data.patients; track patient.uhid) {
              <mat-option [value]="patient.uhid">{{ patient.name }} ({{ patient.uhid }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Time</mat-label>
          <input matInput type="time" formControlName="time" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ status }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class AppointmentFormDialogComponent implements OnInit {
  readonly data = inject<AppointmentDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AppointmentFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly statuses: AppointmentStatus[] = ['Scheduled', 'Completed', 'Cancelled'];

  readonly form = this.fb.nonNullable.group({
    doctor: [0, Validators.required],
    patient: ['', Validators.required],
    date: [null as Date | null, Validators.required],
    time: ['', Validators.required],
    status: ['Scheduled' as AppointmentStatus, Validators.required],
  });

  ngOnInit(): void {
    if (this.data.appointment) {
      const appt = this.data.appointment;
      this.form.patchValue({
        doctor: appt.doctor,
        patient: appt.patient,
        date: new Date(appt.date),
        time: appt.time.slice(0, 5),
        status: appt.status,
      });
    } else if (this.data.prefilledDate || this.data.prefilledTime || this.data.lockedDoctorId) {
      this.form.patchValue({
        doctor: this.data.lockedDoctorId ?? 0,
        date: this.data.prefilledDate ? new Date(this.data.prefilledDate) : null,
        time: this.data.prefilledTime ?? '',
      });
    }

    if (this.data.lockedDoctorId) {
      this.form.controls.doctor.disable();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const date = raw.date as Date;
    const payload = {
      doctor: raw.doctor,
      patient: raw.patient,
      date: date.toISOString().slice(0, 10),
      time: raw.time.length === 5 ? `${raw.time}:00` : raw.time,
      status: raw.status,
    };
    this.dialogRef.close(payload);
  }
}
