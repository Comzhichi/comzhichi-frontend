import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { AiChat } from '../../components/ai-chat/ai-chat';

@Component({
  selector: 'app-student-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    AiChat,
  ],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.css',
})
export class StudentLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  aiAgentOpen = signal(false);
  chatOpen = signal(false);

  get userName(): string {
    return this.auth.currentUser()?.fullName ?? 'Estudiante';
  }

  get userEmail(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  get initials(): string {
    const name = this.userName.trim();
    if (!name) return 'E';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  toggleAiAgent(): void {
    this.aiAgentOpen.update((v) => !v);
    this.chatOpen.set(false);
    this.sidebarOpen.set(false);
  }

  openChat(): void {
    this.chatOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
