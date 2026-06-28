import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentStatus } from '../models/clinic.models';

export interface AppointmentFilters {
  status?: AppointmentStatus;
  doctor?: number;
  patient?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/appointments`;
  private readonly myUrl = `${environment.apiBaseUrl}/doctor/appointments`;

  list(filters?: AppointmentFilters): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.doctor) {
      params = params.set('doctor', filters.doctor.toString());
    }
    if (filters?.patient) {
      params = params.set('patient', filters.patient);
    }
    return this.http.get<Appointment[]>(`${this.baseUrl}/`, { params });
  }

  listMy(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.myUrl}/`);
  }

  completeMy(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.myUrl}/${id}/complete/`, {});
  }

  create(payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/`, payload);
  }

  update(id: number, payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/${id}/`, payload);
  }

  patch(id: number, payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }
}
