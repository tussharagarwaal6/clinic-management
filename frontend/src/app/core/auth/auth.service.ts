import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Me, TokenResponse } from '../models/clinic.models';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly meSubject = new BehaviorSubject<Me | null>(null);

  readonly me$ = this.meSubject.asObservable();

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  get currentMe(): Me | null {
    return this.meSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  isAdmin(): boolean {
    return this.currentMe?.role === 'admin';
  }

  isDoctor(): boolean {
    return this.currentMe?.role === 'doctor';
  }

  login(username: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiBaseUrl}/auth/token/`, { username, password })
      .pipe(
        tap((tokens) => {
          localStorage.setItem(ACCESS_KEY, tokens.access);
          localStorage.setItem(REFRESH_KEY, tokens.refresh);
        }),
      );
  }

  loadMe(): Observable<Me> {
    return this.http.get<Me>(`${environment.apiBaseUrl}/auth/me/`).pipe(
      tap((me) => this.meSubject.next(me)),
    );
  }

  refreshAccessToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${environment.apiBaseUrl}/auth/token/refresh/`, {
        refresh: this.refreshToken,
      })
      .pipe(tap((response) => localStorage.setItem(ACCESS_KEY, response.access)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.meSubject.next(null);
    this.router.navigate(['/login']);
  }

  getDefaultRoute(): string {
    if (this.isAdmin()) {
      return '/dashboard';
    }
    if (this.isDoctor()) {
      return '/my-appointments';
    }
    return '/login';
  }
}
