import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/clinic.models';
import { DoctorFormDialogComponent } from './doctor-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss',
})
export class DoctorsComponent implements OnInit {
  private readonly doctorService = inject(DoctorService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  doctors: Doctor[] = [];
  displayedColumns = ['name', 'email', 'specialization', 'username', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.doctorService.list().subscribe((doctors) => {
      this.doctors = doctors;
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(DoctorFormDialogComponent, { width: '480px', data: {} });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.doctorService.create(payload).subscribe((doctor) => {
        this.load();
        const msg = doctor.generated_password
          ? `Doctor created. Login: ${doctor.username} / ${doctor.generated_password}`
          : 'Doctor created.';
        this.snackBar.open(msg, 'Close', { duration: 8000 });
      });
    });
  }

  openEdit(doctor: Doctor): void {
    const ref = this.dialog.open(DoctorFormDialogComponent, {
      width: '480px',
      data: { doctor },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.doctorService.update(doctor.id, payload).subscribe(() => this.load());
    });
  }

  deleteDoctor(doctor: Doctor): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Doctor', message: `Delete ${doctor.name}?` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.doctorService.delete(doctor.id).subscribe(() => this.load());
    });
  }
}
