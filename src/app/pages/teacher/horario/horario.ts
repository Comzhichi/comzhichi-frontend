import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';

@Component({
  selector: 'app-teacher-horario',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, LanguageFlagPipe, LanguageColorPipe],
  templateUrl: './horario.html',
  styleUrl: './horario.css',
})
export class Horario implements OnInit {
  private sectionService = inject(SectionService);
  private auth = inject(AuthService);

  sections = signal<Section[]>([]);
  loading = signal(true);

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
}