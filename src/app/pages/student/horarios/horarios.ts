import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SectionService } from '../../../service/section.service';
import { CourseService } from '../../../service/course.service';
import { Section } from '../../../model/section.model';
import { Course } from '../../../model/course.model';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';

@Component({
  selector: 'app-student-horarios',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LanguageFlagPipe,
    LanguageColorPipe,
  ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class Horarios implements OnInit {
  private sectionService = inject(SectionService);
  private courseService = inject(CourseService);

  loading = signal(true);
  sections = signal<Section[]>([]);
  courses = signal<Course[]>([]);
  error = signal('');

  searchQuery = signal<string>('');
  selectedLanguage = signal<string>('');
  selectedLevel = signal<string>('');
  selectedSchedule = signal<string>('');

  private courseMap = computed(() => {
    const map = new Map<number, Course>();
    for (const c of this.courses()) map.set(c.id, c);
    return map;
  });

  languageOfSection(s: Section): string {
    return this.courseMap().get(s.courseId)?.language || s.language || '';
  }

  levelOfSection(s: Section): string {
    return s.courseLevel || this.courseMap().get(s.courseId)?.level || '';
  }

  languages = computed(() => {
    const set = new Set<string>();
    for (const s of this.sections()) {
      const lang = this.languageOfSection(s).trim();
      if (lang) set.add(lang);
    }
    return [...set].sort();
  });

  levels = computed(() => {
    const set = new Set<string>();
    for (const s of this.sections()) {
      const level = this.levelOfSection(s).trim();
      if (level) set.add(level);
    }
    return [...set].sort();
  });

  scheduleOptions = computed(() => ['Mañana', 'Tarde', 'Noche']);

  filteredSections = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const lang = this.selectedLanguage().trim().toLowerCase();
    const level = this.selectedLevel().trim().toLowerCase();
    const schedule = this.selectedSchedule().trim().toLowerCase();
    return this.sections().filter((s) => {
      const teacher = s.teacherName ?? s.teacherSpecialty ?? '';
      const matchQ =
        !q ||
        s.courseName.toLowerCase().includes(q) ||
        s.groupCode.toLowerCase().includes(q) ||
        teacher.toLowerCase().includes(q);
      const sLang = this.languageOfSection(s).trim().toLowerCase();
      const sLevel = this.levelOfSection(s).trim().toLowerCase();
      const sSchedule = shiftOf(s.startTime).toLowerCase();
      const matchLang = !lang || sLang === lang;
      const matchLevel = !level || sLevel === level;
      const matchSchedule = !schedule || sSchedule === schedule;
      return matchQ && matchLang && matchLevel && matchSchedule;
    });
  });

  ngOnInit(): void {
    forkJoin({
      sections: this.sectionService.getAll(),
      courses: this.courseService.getAll(),
    }).subscribe({
      next: ({ sections, courses }) => {
        this.sections.set(sections);
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => {
        this.sections.set([]);
        this.courses.set([]);
        this.loading.set(false);
        this.error.set('No se pudieron cargar los horarios disponibles.');
      },
    });
  }

  languageOf(s: Section): string {
    return this.languageOfSection(s) || '—';
  }

  levelOf(s: Section): string {
    return this.levelOfSection(s) || '—';
  }

  levelCategory(level: string | null | undefined): string {
    const l = (level || '').toLowerCase().trim();
    if (l === 'a1' || l === 'a2' || l.includes('básico') || l.includes('basico')) return 'Básico';
    if (l === 'b1' || l === 'b2' || l.includes('intermedio')) return 'Intermedio';
    if (l === 'c1' || l === 'c2' || l.includes('avanzado')) return 'Avanzado';
    return level || '';
  }

  scheduleText(s: Section): string {
    return `${s.dayOfWeek} ${s.startTime}-${s.endTime}`;
  }
}
