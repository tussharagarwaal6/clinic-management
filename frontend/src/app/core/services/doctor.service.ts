import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor } from '../models/clinic.models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/doctors`;

  list(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/`);
  }

  create(payload: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.baseUrl}/`, payload);
  }

  update(id: number, payload: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.baseUrl}/${id}/`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  listSpecializations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/specializations/`);
  }
}
