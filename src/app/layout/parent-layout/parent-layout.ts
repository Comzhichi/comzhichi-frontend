import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-parent-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './parent-layout.html',
  styleUrl: './parent-layout.css',
})
export class ParentLayout implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  sidebarOpen = signal(false);

  /** Cantidad de notificaciones no leídas, mostrada como badge en el menú. */
  unread = signal(0);

  get userName(): string {
    return this.auth.currentUser()?.fullName ?? 'Apoderado';
  }

  get userEmail(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  get initials(): string {
    const parts = this.userName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  ngOnInit(): void {
    this.refreshUnread();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.refreshUnread());
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

  private refreshUnread(): void {
    this.notificationService.getMine().subscribe({
      next: (list) => this.unread.set(list.filter((n) => !n.read).length),
      error: () => this.unread.set(0),
    });
  }
}
