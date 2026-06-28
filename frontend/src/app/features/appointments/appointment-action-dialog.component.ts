import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Appointment } from '../../core/models/clinic.models';

export type AppointmentAction = 'edit' | 'complete' | 'cancel' | 'delete';

export interface AppointmentActionDialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-appointment-action-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Appointment</h2>
    <mat-dialog-content>
      <p><strong>Patient:</strong> {{ data.appointment.patient_name }} ({{ data.appointment.patient }})</p>
      <p><strong>Date:</strong> {{ data.appointment.date }}</p>
      <p><strong>Time:</strong> {{ data.appointment.time }}</p>
      <p><strong>Status:</strong> {{ data.appointment.status }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Close</button>
      <button mat-stroked-button color="primary" type="button" (click)="choose('edit')">Edit</button>
      <button mat-stroked-button type="button" (click)="choose('complete')">Mark Completed</button>
      <button mat-stroked-button type="button" (click)="choose('cancel')">Mark Cancelled</button>
      <button mat-flat-button color="warn" type="button" (click)="choose('delete')">Delete</button>
    </mat-dialog-actions>
  `,
})
export class AppointmentActionDialogComponent {
  readonly data = inject<AppointmentActionDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AppointmentActionDialogComponent, AppointmentAction>);

  choose(action: AppointmentAction): void {
    this.dialogRef.close(action);
  }
}
