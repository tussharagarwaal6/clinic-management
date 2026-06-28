import { Routes } from '@angular/router';
import { authGuard, adminGuard, doctorGuard } from './core/auth/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DoctorsComponent } from './features/doctors/doctors.component';
import { PatientsComponent } from './features/patients/patients.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { MyAppointmentsComponent } from './features/my-appointments/my-appointments.component';
import { inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { Router } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [adminGuard] },
      { path: 'doctors', component: DoctorsComponent, canActivate: [adminGuard] },
      { path: 'patients', component: PatientsComponent, canActivate: [adminGuard] },
      { path: 'appointments', component: AppointmentsComponent, canActivate: [adminGuard] },
      { path: 'my-appointments', component: MyAppointmentsComponent, canActivate: [doctorGuard] },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const auth = inject(AuthService);
          const router = inject(Router);
          return router.parseUrl(auth.getDefaultRoute());
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: () => {
      const auth = inject(AuthService);
      const router = inject(Router);
      return router.parseUrl(auth.isLoggedIn() ? auth.getDefaultRoute() : '/login');
    },
  },
];
