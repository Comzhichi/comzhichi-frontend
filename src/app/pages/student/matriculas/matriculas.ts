import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../service/auth.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { SectionService } from '../../../service/section.service';
import { CourseService } from '../../../service/course.service';
import { AcademicService } from '../../../service/academic.service';
import { Enrollment } from '../../../model/enrollment.model';
import { Section } from '../../../model/section.model';
import { Course } from '../../../model/course.model';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';

interface ParsedSchedule {
  days: Set<string>;
  start: number;
  end: number;
}

const DAY_MAP: Record<string, string> = {
  LUN: 'Lun',
  MAR: 'Mar',
  MIE: 'Mie',
  JUE: 'Jue',
  VIE: 'Vie',
  SAB: 'Sab',
  DOM: 'Dom',
  MON: 'Lun',
  TUE: 'Mar',
  WED: 'Mie',
  THU: 'Jue',
  FRI: 'Vie',
  SAT: 'Sab',
  SUN: 'Dom',
};

function normalizeDays(dayOfWeek: string): Set<string> {
  const s = (dayOfWeek || '').toUpperCase();
  const days = new Set<string>();
  for (const key of Object.keys(DAY_MAP)) {
    if (s.includes(key)) days.add(DAY_MAP[key]);
  }
  return days;
}

function toMinutes(time: string): number {
  const m = (time || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return +m[1] * 60 + +m[2];
}

function parseSectionSchedule(s: Section): ParsedSchedule | null {
  const days = normalizeDays(s.dayOfWeek);
  if (days.size === 0) return null;
  const start = toMinutes(s.startTime);
  const end = toMinutes(s.endTime);
  if (end <= start) return null;
  return { days, start, end };
}

function schedulesOverlap(a: ParsedSchedule | null, b: ParsedSchedule | null): boolean {
  if (!a || !b) return false;
  const dayOverlap = [...a.days].some((d) => b.days.has(d));
  if (!dayOverlap) return false;
  return a.start < b.end && b.start < a.end;
}

function shiftOf(time: string): string {
  const mins = toMinutes(time);
  if (mins < 12 * 60) return 'Manana';
  if (mins < 18 * 60) return 'Tarde';
  return 'Noche';
}

@Component({
  selector: 'app-student-matriculas',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LanguageFlagPipe,
    LanguageColorPipe,
  ],
  templateUrl: './matriculas.html',
  styleUrl: './matriculas.css',
})
export class Matriculas implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private sectionService = inject(SectionService);
  private courseService = inject(CourseService);
  private academic = inject(AcademicService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  enrolled = signal<Enrollment[]>([]);
  levelResults = signal<Record<number, string>>({});
  sections = signal<Section[]>([]);
  courses = signal<Course[]>([]);
  error = signal('');

  searchQuery = signal('');
  selectedLanguage = signal<string>('');
  selectedLevel = signal<string>('');
  selectedSchedule = signal<string>('');
  selectedIds = signal<Set<number>>(new Set());
  registering = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error' | ''>('');

  findSectionForEnrollment(e: Enrollment): Section | undefined {
    let sec = this.sections().find((s) => s.id === e.sectionId);
    if (!sec) {
      sec = this.sections().find(
        (s) =>
          (s.courseName || '').trim().toLowerCase() === (e.courseName || '').trim().toLowerCase(),
      );
    }
    return sec;
  }

  enrolledSchedule(e: Enrollment): string {
    const sec = this.findSectionForEnrollment(e);
    if (sec) return sec.dayOfWeek + ' ' + sec.startTime + '-' + sec.endTime;
    return e.schedule ?? '—';
  }

  enrolledRanges = computed(() => {
    return this.enrolled()
      .filter((e) => e.status === 'ACTIVE')
      .map((e) => {
        const sec = this.findSectionForEnrollment(e);
        if (sec) return parseSectionSchedule(sec);
        if (e.schedule) {
          const days = normalizeDays(e.schedule);
          const m = e.schedule.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          if (days.size && m) {
            return { days, start: +m[1] * 60 + +m[2], end: +m[3] * 60 + +m[4] };
          }
        }
        return null;
      })
      .filter((r): r is ParsedSchedule => r !== null);
  });

  enrolledCourseKeys = computed(() => {
    const exact = new Set<string>();
    const byName = new Set<string>();
    for (const e of this.enrolled()) {
      if (e.status !== 'ACTIVE' && e.status !== 'APPROVED') continue;
      const name = (e.courseName || '').trim().toLowerCase();
      const sec = this.findSectionForEnrollment(e);
      const level = (sec?.courseLevel || '').trim().toLowerCase();
      if (level) {
        exact.add(name + '|' + level);
      } else {
        byName.add(name);
      }
    }
    return { exact, byName };
  });

  courseMap = computed(() => {
    const map = new Map<number, Course>();
    for (const c of this.courses()) map.set(c.id, c);
    return map;
  });

  languageOfSection(s: Section): string {
    return this.courseMap().get(s.courseId)?.language || s.language || '';
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
      const level = (s.courseLevel || '').trim();
      if (level) set.add(level);
    }
    return [...set].sort();
  });

  scheduleOptions = ['Mañana', 'Tarde', 'Noche'];

  filteredSections = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const langFilter = this.selectedLanguage().trim().toLowerCase();
    const levelFilter = this.selectedLevel().trim().toLowerCase();
    const scheduleFilter = this.selectedSchedule().trim().toLowerCase();
    const enrolled = this.enrolledCourseKeys();
    return this.sections().filter((s) => {
      const name = (s.courseName || '').trim().toLowerCase();
      const level = (s.courseLevel || '').trim().toLowerCase();
      if (enrolled.byName.has(name)) return false;
      if (enrolled.exact.has(name + '|' + level)) return false;
      const sLang = this.languageOfSection(s).trim().toLowerCase();
      if (langFilter && sLang !== langFilter) return false;
      const teacher = s.teacherName ?? s.teacherSpecialty;
      const matchQ =
        !q ||
        s.courseName.toLowerCase().includes(q) ||
        s.groupCode.toLowerCase().includes(q) ||
        teacher.toLowerCase().includes(q);
      const lvl = (s.courseLevel ?? '').trim().toLowerCase();
      const shift = shiftOf(s.startTime).trim().toLowerCase();
      const matchLevel = !levelFilter || lvl === levelFilter;
      const matchSchedule = !scheduleFilter || shift === scheduleFilter;
      return matchQ && matchLevel && matchSchedule;
    });
  });

  conflictsWithEnrolled(id: number): boolean {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return false;
    const cs = parseSectionSchedule(sec);
    return this.enrolledRanges().some((r) => schedulesOverlap(cs, r));
  }

  conflictsWithSelected(id: number): boolean {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return false;
    const cs = parseSectionSchedule(sec);
    const selected = this.sections().filter((s) => this.selectedIds().has(s.id) && s.id !== id);
    return selected.some((s) => schedulesOverlap(cs, parseSectionSchedule(s)));
  }

  isConflict(id: number): boolean {
    return this.conflictsWithEnrolled(id) || this.conflictsWithSelected(id);
  }

  conflictReason(id: number): string {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return '';
    const cs = parseSectionSchedule(sec);
    // enrolled
    for (const e of this.enrolled()) {
      if (e.status !== 'ACTIVE' && e.status !== 'APPROVED') continue;
      const es = this.sections().find((s) => s.id === e.sectionId);
      const ers = es ? parseSectionSchedule(es) : null;
      if (ers && schedulesOverlap(cs, ers)) {
        return 'Cruza con ' + e.courseName + ' (' + this.enrolledSchedule(e) + ')';
      }
    }
    // selected
    const selected = this.sections().filter((s) => this.selectedIds().has(s.id) && s.id !== id);
    for (const s of selected) {
      if (schedulesOverlap(cs, parseSectionSchedule(s))) {
        return 'Cruza con ' + s.courseName;
      }
    }
    return 'Cruce de horario';
  }

  toggleSelect(id: number, checked: boolean): void {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return;
    if (checked) {
      if (sec.availableVacancies <= 0) return;
      if (this.conflictsWithEnrolled(id)) {
        this.showMessage('Este curso cruza con tu horario actual.', 'error');
        return;
      }
      if (this.conflictsWithSelected(id)) {
        this.showMessage('Este curso cruza con otro curso seleccionado.', 'error');
        return;
      }
      this.selectedIds.update((s) => {
        const ns = new Set(s);
        ns.add(id);
        return ns;
      });
    } else {
      this.selectedIds.update((s) => {
        const ns = new Set(s);
        ns.delete(id);
        return ns;
      });
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  hasSelection(): boolean {
    return this.selectedIds().size > 0;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    this.snackBar.open(text, 'Cerrar', { duration: 4000 });
  }

  register(): void {
    if (!this.hasSelection()) return;
    const selected = this.sections().filter((s) => this.selectedIds().has(s.id));

    if (selected.some((s) => this.conflictsWithEnrolled(s.id))) {
      this.showMessage('Hay cursos seleccionados que cruzan con tu horario.', 'error');
      return;
    }
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        if (
          schedulesOverlap(parseSectionSchedule(selected[i]), parseSectionSchedule(selected[j]))
        ) {
          this.showMessage('Los cursos seleccionados tienen cruce de horario entre si.', 'error');
          return;
        }
      }
    }

    this.registering.set(true);
    const ids = [...this.selectedIds()];
    const studentId = this.auth.currentUser()?.id ?? 0;
    const enrollmentDate = new Date().toISOString().slice(0, 10);
    let completed = 0;
    let failed = false;

    ids.forEach((id) => {
      this.enrollmentService.create({ sectionId: id, studentId, enrollmentDate, status: 'ACTIVE' }).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length && !failed) {
            this.selectedIds.set(new Set());
            this.showMessage('Matricula registrada con exito.', 'success');
            this.reloadEnrolled();
          }
          if (completed === ids.length) this.registering.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (!failed) {
            failed = true;
            const body = err && err.error;
            let msg =
              (typeof body === 'string' && body) ||
              body?.message ||
              body?.error ||
              body?.detail ||
              body?.title ||
              err?.message ||
              'Error al registrar la matricula.';
            if (Array.isArray(body?.fieldErrors) && body.fieldErrors.length) {
              const details = body.fieldErrors
                .map((fe: any) => fe?.message || fe?.defaultMessage || fe?.field || JSON.stringify(fe))
                .filter(Boolean)
                .join('; ');
              if (details) msg = msg + ' ' + details;
            }
            console.error('Matricula error', err.status, body);
            const finalMsg = err?.status ? msg + ' (HTTP ' + err.status + ')' : msg;
            this.showMessage(String(finalMsg), 'error');
          }
          completed++;
          if (completed === ids.length) this.registering.set(false);
        },
      });
    });
  }

  reloadEnrolled(): void {
    const studentId = this.auth.currentUser()?.id ?? 0;
    const email = this.auth.currentUser()?.email ?? '';
    this.enrollmentService.getAll().subscribe({
      next: (data) => {
        const mine = data.filter((e) =>
          (studentId && e.studentId === studentId) || (email && e.studentEmail === email)
        );
        this.enrolled.set(mine);
        this.loadLevelResults(mine);
      },
      error: () => {},
    });
  }

  loadLevelResults(list: Enrollment[]): void {
    if (list.length === 0) { this.levelResults.set({}); return; }
    forkJoin(list.map((e) =>
      this.academic.getLevelEvaluations(e.id).pipe(
        map((levels) => ({ id: e.id, result: levels.length ? (levels[0].result === 'APPROVED' ? 'Aprobado' : 'Reprobado') : '' }))
      )
    )).subscribe((results) => {
      const map: Record<number, string> = {};
      results.forEach((r) => { if (r.result) map[r.id] = r.result; });
      this.levelResults.set(map);
    });
  }

  levelResult(id: number): string {
    return this.levelResults()[id] ?? '';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      APPROVED: 'Aprobado',
      DROPPED: 'Dado de baja',
      FAILED: 'Reprobado',
    };
    return map[status] ?? status;
  }

  teacherName(s: Section): string {
    return s.teacherName ?? s.teacherSpecialty ?? '—';
  }

  shiftLabel(s: Section): string {
    return shiftOf(s.startTime);
  }

  scheduleText(s: Section): string {
    return `${s.dayOfWeek} ${s.startTime}-${s.endTime}`;
  }

  ngOnInit(): void {
    this.sectionService.getAll().subscribe({
      next: (data) => this.sections.set(data),
      error: () => this.sections.set([]),
    });
    this.courseService.getAll().subscribe({
      next: (data) => this.courses.set(data),
      error: () => this.courses.set([]),
    });
    const studentId = this.auth.currentUser()?.id ?? 0;
    const email = this.auth.currentUser()?.email ?? '';
    this.enrollmentService.getAll().subscribe({
      next: (data) => {
        const mine = data.filter((e) =>
          (studentId && e.studentId === studentId) || (email && e.studentEmail === email)
        );
        this.enrolled.set(mine);
        this.loadLevelResults(mine);
        this.loading.set(false);
      },
      error: () => {
        this.enrolled.set([]);
        this.loading.set(false);
        this.showMessage('No se pudieron cargar las matriculas.', 'error');
      },
    });
  }
}
