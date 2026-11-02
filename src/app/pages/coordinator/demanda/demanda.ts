import { DecimalPipe } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SectionService } from '../../../service/section.service';
import { CourseService } from '../../../service/course.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { Section } from '../../../model/section.model';
import { Course } from '../../../model/course.model';
import { Enrollment } from '../../../model/enrollment.model';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';

interface LanguageDemandRow {
  language: string;
  enrolled: number;
  totalVacancies: number;
  demandPercent: number;
}

interface DemandRow {
  language: string;
  level: string;
  schedule: string;
  sections: number;
  enrolled: number;
  totalVacancies: number;
  availableVacancies: number;
}

function toMinutes(time: string): number {
  const m = (time || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return +m[1] * 60 + +m[2];
}

function shiftOf(time: string): string {
  const mins = toMinutes(time);
  if (mins < 12 * 60) return 'Mañana';
  if (mins < 18 * 60) return 'Tarde';
  return 'Noche';
}

@Component({
  selector: 'app-coordinator-demanda',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, LanguageFlagPipe, LanguageColorPipe, DecimalPipe],
  templateUrl: './demanda.html',
  styleUrl: './demanda.css',
})
export class Demanda implements OnInit {
  private sectionService = inject(SectionService);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);

  loading = signal(true);
  sections = signal<Section[]>([]);
  courses = signal<Course[]>([]);
  enrollments = signal<Enrollment[]>([]);
  error = signal('');

  private courseMap = computed(() => {
    const m = new Map<number, Course>();
    for (const c of this.courses()) m.set(c.id, c);
    return m;
  });

  languageOf(s: Section): string {
    return this.courseMap().get(s.courseId)?.language || s.language || '—';
  }

  levelOf(s: Section): string {
    return this.courseMap().get(s.courseId)?.level || s.courseLevel || '—';
  }

  rows = computed<DemandRow[]>(() => {
    const map = new Map<string, DemandRow>();
    for (const s of this.sections()) {
      const lang = this.languageOf(s);
      const level = this.levelOf(s);
      const schedule = shiftOf(s.startTime);
      const key = `${lang}|${level}|${schedule}`;
      const enrolled = this.enrollments().filter((e) => e.sectionId === s.id && e.status !== 'DROPPED').length;
      const existing = map.get(key);
      if (existing) {
        existing.sections += 1;
        existing.enrolled += enrolled;
        existing.totalVacancies += s.totalVacancies;
        existing.availableVacancies += s.availableVacancies;
      } else {
        map.set(key, {
          language: lang,
          level,
          schedule,
          sections: 1,
          enrolled,
          totalVacancies: s.totalVacancies,
          availableVacancies: s.availableVacancies,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.enrolled - a.enrolled);
  });

  totalEnrolled = computed(() => this.rows().reduce((acc, r) => acc + r.enrolled, 0));

  hasData = computed(() => this.rows().length > 0 && this.totalEnrolled() > 0);

  languageRows = computed<LanguageDemandRow[]>(() => {
    const map = new Map<string, { enrolled: number; totalVacancies: number }>();
    for (const s of this.sections()) {
      const lang = this.languageOf(s);
      const enrolled = this.enrollments().filter((e) => e.sectionId === s.id && e.status !== 'DROPPED').length;
      const existing = map.get(lang);
      if (existing) {
        existing.enrolled += enrolled;
        existing.totalVacancies += s.totalVacancies;
      } else {
        map.set(lang, { enrolled, totalVacancies: s.totalVacancies });
      }
    }
    return [...map.entries()]
      .map(([language, v]) => ({
        language,
        enrolled: v.enrolled,
        totalVacancies: v.totalVacancies,
        demandPercent: v.totalVacancies > 0 ? (v.enrolled / v.totalVacancies) * 100 : 0,
      }))
      .sort((a, b) => b.demandPercent - a.demandPercent);
  });

  hasLanguageData = computed(() => this.languageRows().length > 0);

  exportExcel(): void {
    if (!this.hasData()) return;
    const headers = ['Idioma', 'Nivel', 'Horario', 'Secciones', 'Matriculados', 'Vacantes disponibles', 'Vacantes totales'];
    const lines = [headers.join(',')];
    for (const r of this.rows()) {
      lines.push([
        r.language,
        r.level,
        r.schedule,
        r.sections,
        r.enrolled,
        r.availableVacancies,
        r.totalVacancies,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demanda.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    if (!this.hasData()) return;
    window.print();
  }

  ngOnInit(): void {
    forkJoin({
      sections: this.sectionService.getAll(),
      courses: this.courseService.getAll(),
      enrollments: this.enrollmentService.getAll(),
    }).subscribe({
      next: ({ sections, courses, enrollments }) => {
        this.sections.set(sections);
        this.courses.set(courses);
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los datos de demanda.');
      },
    });
  }
}
