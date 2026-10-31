import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../service/notification.service';
import { AppNotification } from '../../../model/parent.model';

@Component({
  selector: 'app-parent-notificaciones',
  imports: [
    DatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones implements OnInit {
  private notificationService = inject(NotificationService);

  loading = signal(true);
  error = signal('');
  notifications = signal<AppNotification[]>([]);
  view = signal<'UNREAD' | 'ALL'>('UNREAD');

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  visible = computed(() =>
    this.view() === 'UNREAD' ? this.notifications().filter((n) => !n.read) : this.notifications(),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notificationService.getMine().subscribe({
      next: (list) => {
        this.notifications.set([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las notificaciones.');
        this.loading.set(false);
      },
    });
  }

  markAsRead(n: AppNotification): void {
    this.notificationService.markAsRead(n.id).subscribe(() => {
      this.notifications.update((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    });
  }

  markAllAsRead(): void {
    this.notifications()
      .filter((n) => !n.read)
      .forEach((n) => this.markAsRead(n));
  }

  /** Traduce los resultados que envía el backend (APPROVED / FAILED) al español. */
  messageOf(n: AppNotification): string {
    return n.message.replace(/\bAPPROVED\b/g, 'Aprobado').replace(/\bFAILED\b/g, 'Desaprobado');
  }

  /** Ícono según el tipo de evento académico descrito en el mensaje. */
  iconFor(n: AppNotification): string {
    const msg = n.message.toLowerCase();
    if (msg.includes('evaluación') || msg.includes('resultado')) return 'school';
    if (msg.includes('asistencia')) return 'event_available';
    return 'notifications';
  }
}
