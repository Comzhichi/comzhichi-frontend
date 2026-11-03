import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-coordinator-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './coordinator-layout.html',
  styleUrl: './coordinator-layout.css',
})
export class CoordinatorLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(false);

  get userName(): string {
    return this.auth.currentUser()?.fullName ?? 'Coordinador';
  }

  get userEmail(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  get initials(): string {
    const name = this.userName.trim();
    if (!name) return 'C';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}