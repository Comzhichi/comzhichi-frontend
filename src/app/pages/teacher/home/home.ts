import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';

@Component({
  selector: 'app-teacher-home',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private sectionService = inject(SectionService);
  private auth = inject(AuthService);

  sections = signal<Section[]>([]);
  loading = signal(true);

  get userName() { return this.auth.currentUser()?.fullName ?? 'Docente'; }
  get profileId() { 
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

  formatDays(days: string): string {
    const map: Record<string, string> = {
      MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
      THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
    };
    return days.split(',').map(d => map[d.trim()] ?? d).join(' / ');
  }
}