import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';

@Component({
  selector: 'app-teacher-home',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private sectionService = inject(SectionService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  sections = signal<Section[]>([]);
  loading  = signal(true);

  get userName() { return this.auth.currentUser()?.fullName ?? 'Docente'; }

  get profileId(): number | null {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw).profileId : null;
  }

  ngOnInit() {
    const pid = this.profileId;
    this.sectionService.getAll().subscribe({
      next: (data) => {
        this.sections.set(pid ? data.filter(s => s.teacherId === pid) : data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToSection(id: number) {
    this.router.navigate(['/teacher/section', id]);
  }

  formatDays(days: string): string {
    const map: Record<string, string> = {
      MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
      THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb',
    };
    return days.split(',').map(d => map[d.trim()] ?? d).join(' / ');
  }
}