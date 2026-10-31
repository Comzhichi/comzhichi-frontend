import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-parent-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './parent-layout.html',
  styleUrl: './parent-layout.css',
})
export class ParentLayout implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  /** Cantidad de notificaciones no leídas, mostrada como badge en el menú. */
  unread = signal(0);

  ngOnInit(): void {
    this.refreshUnread();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.refreshUnread());
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
