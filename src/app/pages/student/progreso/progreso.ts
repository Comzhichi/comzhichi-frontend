import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin, of, switchMap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../service/auth.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { CourseService } from '../../../service/course.service';
import { SectionService } from '../../../service/section.service';
import { TeacherService } from '../../../service/teacher.service';
import { Enrollment } from '../../../model/enrollment.model';
import { Attendance, Evaluation, LevelEvaluation } from '../../../model/academic.model';
import { Course } from '../../../model/course.model';
import { Section } from '../../../model/section.model';
import { Teacher } from '../../../model/teacher.model';


interface HistoryRow {
  course: string;
  level: string;
  cycle: string;
  grade: number | null;
  status: string;
}

interface LanguageSummary {
  language: string;
  level: string;
  currentCourse: string;
  progress: number;
  status: string;
}

interface ModuleItem {
  name: string;
  level: string;
  requirements: string;
  status: 'disponible' | 'bloqueado' | 'pendiente';
}

interface EnabledCourse {
  name: string;
  level: string;
  enabled: boolean;
}

@Component({
  selector: 'app-student-progreso',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css',
})
export class Progreso implements OnInit {
  private auth = inject(AuthService);
  private enrollmentService = inject(EnrollmentService);
  private academic = inject(AcademicService);
  private courseService = inject(CourseService);
  private sectionService = inject(SectionService);
  private teacherService = inject(TeacherService);

  loading = signal(true);
  error = signal('');

  enrollments = signal<Enrollment[]>([]);
  courses = signal<Course[]>([]);
  sections = signal<Section[]>([]);
  teachers = signal<Teacher[]>([]);

  attendances = signal<Record<number, Attendance[]>>({});
  evaluations = signal<Record<number, Evaluation[]>>({});
  levelEvaluations = signal<Record<number, LevelEvaluation[]>>({});

  selectedLanguage = signal<string>('');
  selectedCycle = signal<string>('');

  private courseByName = computed(() => {
    const m = new Map<string, Course>();
    for (const c of this.courses()) m.set(c.name.trim().toLowerCase(), c);
    return m;
  });

  private sectionById = computed(() => {
    const m = new Map<number, Section>();
    for (const s of this.sections()) m.set(s.id, s);
    return m;
  });

  private teacherById = computed(() => {
    const m = new Map<number, Teacher>();
    for (const t of this.teachers()) m.set(t.id, t);
    return m;
  });

  languages = computed(() => {
    const set = new Set<string>();
    for (const c of this.courses()) {
      const lang = (c.language || '').trim();
      if (lang) set.add(lang);
    }
    for (const e of this.enrollments()) {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      const lang = (c?.language || '').trim();
      if (lang) set.add(lang);
    }
    return [...set].sort();
  });

  cycles = computed(() => {
    const set = new Set<string>();
    for (const e of this.enrollments()) {
      const c = this.cycleOf(e.enrollmentDate);
      if (c) set.add(c);
    }
    return [...set].sort().reverse();
  });

  studentEnrollments = computed(() => {
    const studentId = this.auth.currentUser()?.id ?? 0;
    const email = this.auth.currentUser()?.email ?? '';
    return this.enrollments().filter((e) =>
      (studentId && e.studentId === studentId) || (email && e.studentEmail === email)
    );
  });

  filteredEnrollments = computed(() => {
    const langSel = this.selectedLanguage().trim();
    const lang = (langSel && langSel !== 'Todos') ? langSel.toLowerCase() : '';
    const cycle = this.selectedCycle().trim();
    return this.studentEnrollments().filter((e) => {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      const eLang = (c?.language || '').trim().toLowerCase();
      if (lang && eLang !== lang) return false;
      if (cycle && cycle !== 'Todos' && this.cycleOf(e.enrollmentDate) !== cycle) return false;
      return true;
    });
  });

  hasAcademicInfo = computed(() => this.filteredEnrollments().length > 0);

  currentEnrollment = computed<Enrollment | null>(() => {
    const list = this.filteredEnrollments();
    if (list.length === 0) return null;
    const active = list.filter((e) => e.status === 'ACTIVE');
    if (active.length) {
      return [...active].sort((a, b) =>
        (b.enrollmentDate || '').localeCompare(a.enrollmentDate || '')
      )[0];
    }
    // sin matrícula activa: tomar el curso más avanzado
    return [...list].sort((a, b) => {
      const ca = this.courseByName().get(a.courseName.trim().toLowerCase());
      const cb = this.courseByName().get(b.courseName.trim().toLowerCase());
      return (cb?.id ?? 0) - (ca?.id ?? 0);
    })[0];
  });

  currentCourse = computed<Course | null>(() => {
    const e = this.currentEnrollment();
    if (!e) return null;
    return this.courseByName().get(e.courseName.trim().toLowerCase()) ?? null;
  });

  approvedEnrollments = computed(() => {
    return this.filteredEnrollments().filter((e) => {
      if (e.status === 'APPROVED') return true;
      const levels = this.levelEvaluations()[e.id] ?? [];
      return levels.some((l) => l.result === 'APPROVED');
    });
  });

  highestApprovedCourse = computed<Course | null>(() => {
    const approved = this.approvedEnrollments();
    if (approved.length === 0) return null;
    const courses = approved
      .map((e) => this.courseByName().get(e.courseName.trim().toLowerCase()))
      .filter((c): c is Course => !!c);
    if (courses.length === 0) return null;
    return courses.reduce((a, b) => (a.id >= b.id ? a : b));
  });

  levelActual = computed<string>(() => {
    const cc = this.currentCourse();
    if (cc) return this.levelCategory(cc.level);
    const hc = this.highestApprovedCourse();
    if (hc) return this.levelCategory(hc.level);
    return '—';
  });

  languageSelected = computed<string>(() => {
    const sel = this.selectedLanguage().trim();
    if (sel && sel !== 'Todos') return sel;
    const cc = this.currentCourse();
    if (cc) return cc.language;
    const first = this.filteredEnrollments()[0];
    if (first) {
      const c = this.courseByName().get(first.courseName.trim().toLowerCase());
      if (c?.language) return c.language;
    }
    return '';
  });

  currentAttendances = computed(() => {
    const e = this.currentEnrollment();
    if (!e) return [];
    return this.attendances()[e.id] ?? [];
  });

  attendancePercent = computed(() => {
    const atts = this.currentAttendances();
    if (atts.length === 0) return 0;
    const present = atts.filter((a) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'JUSTIFIED').length;
    return Math.round((present / atts.length) * 100);
  });

  sessionsAttended = computed(() => {
    return this.currentAttendances().filter((a) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'JUSTIFIED').length;
  });

  sessionsMissed = computed(() => {
    return this.currentAttendances().filter((a) => a.status === 'ABSENT').length;
  });

  progressPercent = computed(() => {
    const lang = this.languageSelected();
    if (!lang) return 0;
    const langCourses = this.courses().filter((c) => c.language.trim().toLowerCase() === lang.trim().toLowerCase());
    if (langCourses.length === 0) return 0;
    const approvedIds = new Set(this.approvedEnrollments().map((e) => {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      return c?.id;
    }).filter((x): x is number => !!x));
    return Math.round((approvedIds.size / langCourses.length) * 100);
  });

  currentTeacherName = computed<string>(() => {
    const e = this.currentEnrollment();
    if (!e) return '—';
    const sec = this.sectionById().get(e.sectionId);
    if (sec?.teacherId) {
      const t = this.teacherById().get(sec.teacherId);
      if (t) return t.userFullName;
      if (sec.teacherSpecialty) return sec.teacherSpecialty;
    }
    const found = this.sections().find((s) => s.groupCode === e.sectionGroupCode);
    if (found?.teacherId) {
      const t = this.teacherById().get(found.teacherId);
      if (t) return t.userFullName;
    }
    return '—';
  });

  currentSchedule = computed<string>(() => {
    const e = this.currentEnrollment();
    if (!e) return '—';
    if (e.sectionDayOfWeek) return `${e.sectionDayOfWeek} ${e.sectionStartTime ?? ''}-${e.sectionEndTime ?? ''}`.trim();
    return '—';
  });

  nextModules = computed<ModuleItem[]>(() => {
    const lang = this.languageSelected();
    if (!lang) return [];
    const langCourses = this.courses().filter((c) => c.language.trim().toLowerCase() === lang.trim().toLowerCase());
    const approvedIds = new Set(this.approvedEnrollments().map((e) => {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      return c?.id;
    }).filter((x): x is number => !!x));
    const approvedNames = new Set(this.approvedEnrollments().map((e) => e.courseName.trim().toLowerCase()));

    const base = this.highestApprovedCourse() ?? this.currentCourse();
    let candidates: Course[] = [];
    if (base) {
      const dependents = langCourses.filter((c) => c.prerequisiteId === base.id || (c.prerequisiteName && base.name && c.prerequisiteName.toLowerCase() === base.name.toLowerCase()));
      if (dependents.length > 0) candidates = dependents;
    }
    if (candidates.length === 0) {
      candidates = langCourses.filter((c) => !approvedIds.has(c.id));
    }
    candidates = candidates.filter((c) => !approvedIds.has(c.id));
    const current = this.currentCourse();
    if (current) candidates = candidates.filter((c) => c.id !== current.id);

    const enrolledActiveNames = new Set(
      this.filteredEnrollments()
        .filter((e) => e.status === 'ACTIVE')
        .map((e) => e.courseName.trim().toLowerCase())
    );

    return candidates.map((c) => {
      const prereqFulfilled = c.prerequisiteId == null || approvedIds.has(c.prerequisiteId) ||
        (c.prerequisiteName != null && approvedNames.has(c.prerequisiteName.trim().toLowerCase()));
      let status: ModuleItem['status'] = 'disponible';
      if (!prereqFulfilled) status = 'bloqueado';
      else if (enrolledActiveNames.has(c.name.trim().toLowerCase())) status = 'pendiente';
      const req = c.prerequisiteName ? `Prerrequisito: ${this.courseDisplayName(c.prerequisiteName, c.prerequisiteName)}` : 'Sin prerrequisitos';
      return { name: this.courseDisplayName(c.name, c.level), level: this.levelCategory(c.level), requirements: req, status };
    });
  });

  history = computed<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [];
    for (const e of this.filteredEnrollments()) {
      const evals = this.evaluations()[e.id] ?? [];
      const scores = evals.map((x) => x.score);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      if (avg === null) continue;
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      const status = this.courseStatus(e);
      rows.push({
        course: this.courseDisplayName(e.courseName, c?.level ?? ''),
        level: this.levelCategory(c?.level ?? ''),
        cycle: this.cycleOf(e.enrollmentDate),
        grade: avg,
        status,
      });
    }
    return rows;
  });

  hasHistory = computed(() => this.history().length > 0);

  languageSummaries = computed<LanguageSummary[]>(() => {
    const langs = new Set<string>();
    for (const e of this.studentEnrollments()) {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      const lang = (c?.language || '').trim();
      if (lang) langs.add(lang);
    }
    const result: LanguageSummary[] = [];
    for (const lang of langs) {
      const enr = this.studentEnrollments().filter((e) => {
        const c = this.courseByName().get(e.courseName.trim().toLowerCase());
        return (c?.language || '').trim().toLowerCase() === lang.toLowerCase();
      });
      const approved = enr.filter((e) => {
        if (e.status === 'APPROVED') return true;
        const levels = this.levelEvaluations()[e.id] ?? [];
        return levels.some((l) => l.result === 'APPROVED');
      });
      const current = enr.length
        ? [...enr].sort((a, b) => {
            const ca = this.courseByName().get(a.courseName.trim().toLowerCase());
            const cb = this.courseByName().get(b.courseName.trim().toLowerCase());
            return (cb?.id ?? 0) - (ca?.id ?? 0);
          })[0]
        : null;
      const currentCourse = current ? this.courseByName().get(current.courseName.trim().toLowerCase()) : null;
      const langCourses = this.courses().filter((c) => c.language.trim().toLowerCase() === lang.toLowerCase());
      const approvedIds = new Set(approved.map((e) => this.courseByName().get(e.courseName.trim().toLowerCase())?.id).filter((x): x is number => !!x));
      const progress = langCourses.length ? Math.round((approvedIds.size / langCourses.length) * 100) : 0;
      const hasActive = enr.some((e) => e.status === 'ACTIVE');
      const allApproved = langCourses.length > 0 && approvedIds.size >= langCourses.length;
      let status = 'En curso';
      if (allApproved) status = 'Nivel completado';
      else if (enr.some((e) => (this.levelEvaluations()[e.id] ?? []).length === 0 && e.status !== 'APPROVED')) status = 'Pendiente de evaluación';
      if (!hasActive && approved.length === 0) status = 'Pendiente de evaluación';
      result.push({
        language: lang,
        level: currentCourse ? this.levelCategory(currentCourse.level) : (approved.length ? this.levelCategory(approved[approved.length - 1] && this.courseByName().get(approved[approved.length-1].courseName.trim().toLowerCase())?.level) : '—'),
        currentCourse: current ? this.courseDisplayName(current.courseName, currentCourse?.level) : '—',
        progress,
        status,
      });
    }
    return result;
  });

  enabledCourses = computed<EnabledCourse[]>(() => {
    const lang = this.languageSelected();
    if (!lang) return [];
    const langCourses = this.courses().filter((c) => c.language.trim().toLowerCase() === lang.trim().toLowerCase());
    const approvedIds = new Set(this.approvedEnrollments().map((e) => {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      return c?.id;
    }).filter((x): x is number => !!x));
    const approvedNames = new Set(this.approvedEnrollments().map((e) => e.courseName.trim().toLowerCase()));

    const current = this.currentCourse();
    return langCourses
      .filter((c) => !approvedIds.has(c.id) && !approvedNames.has(c.name.trim().toLowerCase()))
      .filter((c) => !current || c.id !== current.id)
      .map((c) => {
        const enabled = c.prerequisiteId == null || approvedIds.has(c.prerequisiteId) ||
          (c.prerequisiteName != null && approvedNames.has(c.prerequisiteName.trim().toLowerCase()));
        return { name: this.courseDisplayName(c.name, c.level), level: this.levelCategory(c.level), enabled };
      });
  });

  ngOnInit(): void {
    const studentId = this.auth.currentUser()?.id ?? 0;
    const email = this.auth.currentUser()?.email ?? '';

    forkJoin({
      enrollments: this.enrollmentService.getAll(),
      courses: this.courseService.getAll(),
      sections: this.sectionService.getAll(),
      teachers: this.teacherService.getAll(),
    }).pipe(
      map(({ enrollments, courses, sections, teachers }) => {
        const mine = enrollments.filter((e) =>
          (studentId && e.studentId === studentId) || (email && e.studentEmail === email)
        );
        return { enrollments: mine, courses, sections, teachers };
      }),
      switchMap((data: { enrollments: Enrollment[]; courses: Course[]; sections: Section[]; teachers: Teacher[] }) => {
        if (data.enrollments.length === 0) {
          return of({
            ...data,
            attendances: {} as Record<number, Attendance[]>,
            evaluations: {} as Record<number, Evaluation[]>,
            levelEvaluations: {} as Record<number, LevelEvaluation[]>,
          });
        }
        const attCalls = data.enrollments.map((e) =>
          this.academic.getAttendances(e.id).pipe(
            map((a) => ({ id: e.id, data: a })),
            catchError(() => of({ id: e.id, data: [] as Attendance[] }))
          )
        );
        const evalCalls = data.enrollments.map((e) =>
          this.academic.getEvaluations(e.id).pipe(
            map((ev) => ({ id: e.id, data: ev })),
            catchError(() => of({ id: e.id, data: [] as Evaluation[] }))
          )
        );
        const levelCalls = data.enrollments.map((e) =>
          this.academic.getLevelEvaluations(e.id).pipe(
            map((lv) => ({ id: e.id, data: lv })),
            catchError(() => of({ id: e.id, data: [] as LevelEvaluation[] }))
          )
        );
        return forkJoin({
          attendances: forkJoin(attCalls).pipe(map((rs) => {
            const m: Record<number, Attendance[]> = {};
            rs.forEach((r) => (m[r.id] = r.data));
            return m;
          })),
          evaluations: forkJoin(evalCalls).pipe(map((rs) => {
            const m: Record<number, Evaluation[]> = {};
            rs.forEach((r) => (m[r.id] = r.data));
            return m;
          })),
          levelEvaluations: forkJoin(levelCalls).pipe(map((rs) => {
            const m: Record<number, LevelEvaluation[]> = {};
            rs.forEach((r) => (m[r.id] = r.data));
            return m;
          })),
        }).pipe(map((res) => ({
          ...data,
          attendances: res.attendances,
          evaluations: res.evaluations,
          levelEvaluations: res.levelEvaluations,
        })));
      })
    ).subscribe({
      next: (data) => {
        this.enrollments.set(data.enrollments);
        this.courses.set(data.courses);
        this.sections.set(data.sections);
        this.teachers.set(data.teachers);
        this.attendances.set(data.attendances);
        this.evaluations.set(data.evaluations);
        this.levelEvaluations.set(data.levelEvaluations);
        if (this.languages().length > 0 && !this.selectedLanguage()) {
          const langsFromEnr = new Set(this.studentEnrollments().map((e) => {
            const c = this.courseByName().get(e.courseName.trim().toLowerCase());
            return c?.language?.trim() ?? '';
          }).filter(Boolean));
          const def = [...langsFromEnr][0] || this.languages()[0];
          this.selectedLanguage.set(def);
        }
        if (this.cycles().length > 0 && !this.selectedCycle()) {
          this.selectedCycle.set('Todos');
        } else if (this.cycles().length === 0) {
          this.selectedCycle.set('Todos');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo recuperar la información del backend. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  cycleOf(date: string | null | undefined): string {
    if (!date) return 'Sin ciclo';
    const s = String(date);
    const y = s.slice(0, 4);
    const m = parseInt(s.slice(5, 7), 10) || 1;
    const sem = m <= 6 ? 1 : 2;
    return `${y}-${sem}`;
  }

  levelCategory(level: string | null | undefined): string {
    const l = (level || '').toLowerCase().trim();
    if (l === 'a1' || l === 'a2' || l.includes('básico') || l.includes('basico')) return 'Básico';
    if (l === 'b1' || l === 'b2' || l.includes('intermedio')) return 'Intermedio';
    if (l === 'c1' || l === 'c2' || l.includes('avanzado')) return 'Avanzado';
    return level || '—';
  }

  courseCode(level: string | null | undefined): string {
    const l = (level || '').toLowerCase().trim();
    if (l === 'a1' || l === 'a2' || l === 'b1' || l === 'b2' || l === 'c1' || l === 'c2') return (level || '').toUpperCase();
    if (l.includes('básico 1') || l.includes('basico 1')) return 'A1';
    if (l.includes('básico 2') || l.includes('basico 2')) return 'A2';
    if (l.includes('intermedio 1')) return 'B1';
    if (l.includes('intermedio 2')) return 'B2';
    if (l.includes('avanzado 1')) return 'C1';
    if (l.includes('avanzado 2')) return 'C2';
    return '';
  }

  courseDisplayName(name: string | null | undefined, level: string | null | undefined): string {
    const n = name || '';
    const code = this.courseCode(level);
    if (!code) return n;
    return n
      .replace(/B[aá]sico\s*1/i, code)
      .replace(/B[aá]sico\s*2/i, code)
      .replace(/Intermedio\s*1/i, code)
      .replace(/Intermedio\s*2/i, code)
      .replace(/Avanzado\s*1/i, code)
      .replace(/Avanzado\s*2/i, code);
  }

  courseStatus(e: Enrollment): string {
    if (e.status === 'APPROVED') return 'Aprobado';
    if (e.status === 'FAILED') return 'Desaprobado';
    if (e.status === 'ACTIVE') {
      const levels = this.levelEvaluations()[e.id] ?? [];
      if (levels.length === 0) return 'Pendiente de calificación';
      return 'En curso';
    }
    return e.status;
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      disponible: 'Disponible',
      bloqueado: 'Bloqueado',
      pendiente: 'Pendiente de aprobación',
    };
    return map[s] ?? s;
  }

  retry(): void {
    this.loading.set(true);
    this.error.set('');
    window.location.reload();
  }

}
