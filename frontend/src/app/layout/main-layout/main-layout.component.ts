import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  readonly me$ = this.auth.me$;

  get navItems(): NavItem[] {
    if (this.auth.isAdmin()) {
      return [
        { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
        { label: 'Doctor Management', route: '/doctors', icon: 'medical_services' },
        { label: 'Patient Management', route: '/patients', icon: 'groups' },
        { label: 'Appointment Scheduler', route: '/appointments', icon: 'event' },
      ];
    }

    return [{ label: 'My Appointments', route: '/my-appointments', icon: 'event_note' }];
  }

  logout(): void {
    this.auth.logout();
  }
}
