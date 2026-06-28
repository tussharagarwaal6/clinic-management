import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient } from '../models/clinic.models';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients`;

  list(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/`);
  }

  create(payload: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${this.baseUrl}/`, payload);
  }

  update(uhid: string, payload: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${uhid}/`, payload);
  }

  delete(uhid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uhid}/`);
  }
}
