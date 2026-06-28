import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/clinic.models';
import { PatientFormDialogComponent } from './patient-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss',
})
export class PatientsComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  patients: Patient[] = [];
  displayedColumns = ['uhid', 'name', 'email', 'phone', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.patientService.list().subscribe((patients) => {
      this.patients = patients;
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(PatientFormDialogComponent, { width: '480px', data: {} });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.patientService.create(payload).subscribe((patient) => {
        this.load();
        this.snackBar.open(`Patient registered with UHID ${patient.uhid}`, 'Close', { duration: 5000 });
      });
    });
  }

  openEdit(patient: Patient): void {
    const ref = this.dialog.open(PatientFormDialogComponent, {
      width: '480px',
      data: { patient },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.patientService.update(patient.uhid, payload).subscribe(() => this.load());
    });
  }

  deletePatient(patient: Patient): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Patient', message: `Delete ${patient.name} (${patient.uhid})?` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.patientService.delete(patient.uhid).subscribe(() => this.load());
    });
  }
}
