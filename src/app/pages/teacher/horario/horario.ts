import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';

@Component({
  selector: 'app-teacher-horario',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './horario.html',
  styleUrl: './horario.css',
})
export class Horario implements OnInit {
  private sectionService = inject(SectionService);
  private auth = inject(AuthService);

  sections = signal<Section[]>([]);
  loading = signal(true);

  readonly days = [
    { key: 'MONDAY', label: 'Lun' },
    { key: 'TUESDAY', label: 'Mar' },
    { key: 'WEDNESDAY', label: 'Mié' },
    { key: 'THURSDAY', label: 'Jue' },
    { key: 'FRIDAY', label: 'Vie' },
    { key: 'SATURDAY', label: 'Sáb' },
  ];
  readonly hours = [7,8,9,10,11,12,13,14,15,16,17,18,19,20];

  ngOnInit() {
    const pid = this.profileId;
    this.sectionService.getAll().subscribe({
      next: (data) => {
        this.sections.set(pid ? data.filter((s) => s.teacherId === pid) : data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get profileId(): number | null {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw).profileId : null;
  }

  formatDays(days: string): string {
    const map: Record<string, string> = {
      MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
      THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb',
    };
    return days.split(',').map((d) => map[d.trim()] ?? d).join(' / ');
  }

  private toMinutes(time: string): number {
    const m = (time || '').match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return +m[1] * 60 + +m[2];
  }

  sectionsByDay(dayKey: string): Section[] {
    return this.sections().filter((s) => (s.dayOfWeek || '').toUpperCase().includes(dayKey));
  }

  eventTop(s: Section): number {
    const start = this.toMinutes(s.startTime);
    const base = 7 * 60;
    return Math.max(0, start - base);
  }

  eventHeight(s: Section): number {
    const start = this.toMinutes(s.startTime);
    const end = this.toMinutes(s.endTime);
    return Math.max(30, end - start);
  }
}