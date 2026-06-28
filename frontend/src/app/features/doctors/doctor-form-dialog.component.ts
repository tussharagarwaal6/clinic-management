import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Doctor } from '../../core/models/clinic.models';
import { DoctorService } from '../../core/services/doctor.service';

export interface DoctorDialogData {
  doctor?: Doctor;
}

@Component({
  selector: 'app-doctor-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.doctor ? 'Edit Doctor' : 'Add Doctor' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Specialization</mat-label>
          <input matInput formControlName="specialization" [matAutocomplete]="specAuto" />
          <mat-autocomplete #specAuto="matAutocomplete">
            @for (spec of filteredSpecializations; track spec) {
              <mat-option [value]="spec">{{ spec }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class DoctorFormDialogComponent implements OnInit {
  readonly data: DoctorDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};
  readonly dialogRef = inject(MatDialogRef<DoctorFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly doctorService = inject(DoctorService);

  specializations: string[] = [];
  filteredSpecializations: string[] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    specialization: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.data?.doctor) {
      this.form.patchValue(this.data.doctor);
    }

    this.doctorService.listSpecializations().subscribe((specializations) => {
      this.specializations = specializations;
      this.filterSpecializations(this.form.controls.specialization.value);
    });

    this.form.controls.specialization.valueChanges.subscribe((value) => {
      this.filterSpecializations(value);
    });
  }

  private filterSpecializations(value: string): void {
    const query = value.trim().toLowerCase();
    this.filteredSpecializations = query
      ? this.specializations.filter((spec) => spec.toLowerCase().includes(query))
      : [...this.specializations];
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
