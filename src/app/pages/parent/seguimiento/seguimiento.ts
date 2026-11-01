import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { LanguageColorPipe } from '../../../util/language-color.pipe';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { ParentService } from '../../../service/parent.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { CourseService } from '../../../service/course.service';
import { StudentParentLink } from '../../../model/parent.model';
import { Enrollment } from '../../../model/enrollment.model';
import { Course } from '../../../model/course.model';
import { Attendance, Evaluation } from '../../../model/academic.model';

/** Registros académicos de una matrícula (un curso en un ciclo). */
interface CourseRecord {
  enrollment: Enrollment;
  cycle: string;
  attendances: Attendance[];
  evaluations: Evaluation[];
  attendanceRate: number | null;
  average: number | null;
}

const ATTENDANCE_LABEL: Record<Attendance['status'], string> = {
  PRESENT: 'Presente',
  ABSENT: 'Falta',
  LATE: 'Tardanza',
  JUSTIFIED: 'Justificada',
};

const ENROLLMENT_LABEL: Record<Enrollment['status'], string> = {
  ACTIVE: 'En curso',
  APPROVED: 'Aprobado',
  FAILED: 'Desaprobado',
  DROPPED: 'Retirado',
};

@Component({
  selector: 'app-parent-seguimiento',
  imports: [
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    LanguageColorPipe,
    LanguageFlagPipe,
  ],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.css',
})
export class Seguimiento implements OnInit {
  private parentService = inject(ParentService);
  private enrollmentService = inject(EnrollmentService);
  private academic = inject(AcademicService);
  private courseService = inject(CourseService);

  loading = signal(true);
  loadingRecords = signal(false);
  error = signal('');

  students = signal<StudentParentLink[]>([]);
  selectedStudentId = signal<number | null>(null);
  records = signal<CourseRecord[]>([]);
  courses = signal<Course[]>([]);
  courseFilter = signal<string>('ALL');

  attendanceColumns = ['date', 'status', 'observation'];
  evaluationColumns = ['date', 'type', 'score', 'feedback'];

  courseOptions = computed(() => [...new Set(this.records().map((r) => r.enrollment.courseName))]);

  filteredRecords = computed(() => {
    const filter = this.courseFilter();
    return filter === 'ALL'
      ? this.records()
      : this.records().filter((r) => r.enrollment.courseName === filter);
  });

  private courseMap = computed(() => {
    const m = new Map<number, Course>();
    for (const c of this.courses()) m.set(c.id, c);
    return m;
  });

  private courseByName = computed(() => {
    const m = new Map<string, Course>();
    for (const c of this.courses()) m.set(c.name.trim().toLowerCase(), c);
    return m;
  });

  /** Resumen de progreso por idioma del estudiante seleccionado. */
  languageSummaries = computed(() => {
    const enrollments = this.records().map((r) => r.enrollment);
    if (enrollments.length === 0) return [];
    const langs = new Set<string>();
    for (const e of enrollments) {
      const c = this.courseByName().get(e.courseName.trim().toLowerCase());
      const lang = (c?.language || '').trim();
      if (lang) langs.add(lang);
    }
    const result: { language: string; level: string; currentCourse: string; progress: number; status: string }[] = [];
    for (const lang of langs) {
      const enr = enrollments.filter((e) => {
        const c = this.courseByName().get(e.courseName.trim().toLowerCase());
        return (c?.language || '').trim().toLowerCase() === lang.toLowerCase();
      });
      const approved = enr.filter((e) => e.status === 'APPROVED');
      const current = enr.length
        ? [...enr].sort((a, b) => (b.enrollmentDate || '').localeCompare(a.enrollmentDate || ''))[0]
        : null;
      const currentCourse = current ? this.courseByName().get(current.courseName.trim().toLowerCase()) : null;
      const langCourses = this.courses().filter((c) => c.language.trim().toLowerCase() === lang.toLowerCase());
      const approvedIds = new Set(approved.map((e) => this.courseByName().get(e.courseName.trim().toLowerCase())?.id).filter((x): x is number => !!x));
      const progress = langCourses.length ? Math.round((approvedIds.size / langCourses.length) * 100) : 0;
      const hasActive = enr.some((e) => e.status === 'ACTIVE');
      const allApproved = langCourses.length > 0 && approvedIds.size >= langCourses.length;
      let status = 'En curso';
      if (allApproved) status = 'Nivel completado';
      else if (!hasActive && approved.length === 0) status = 'Pendiente de evaluación';
      result.push({
        language: lang,
        level: currentCourse ? currentCourse.level : (approved.length ? this.courseByName().get(approved[approved.length - 1].courseName.trim().toLowerCase())?.level ?? '—' : '—'),
        currentCourse: current ? current.courseName : '—',
        progress,
        status,
      });
    }
    return result;
  });

  hasProgress = computed(() => this.languageSummaries().length > 0);

  /** true cuando el alumno no tiene ninguna asistencia ni calificación registrada. */
  hasNoAcademicData = computed(
    () =>
      this.records().length > 0 &&
      this.records().every((r) => r.attendances.length === 0 && r.evaluations.length === 0),
  );

  ngOnInit(): void {
    this.courseService.getAll().subscribe({
      next: (data) => this.courses.set(data),
      error: () => this.courses.set([]),
    });
    this.parentService.getMyStudents().subscribe({
      next: (links) => {
        this.students.set(links);
        this.loading.set(false);
        if (links.length > 0) this.selectStudent(links[0].studentId);
      },
      error: () => {
        this.error.set('No se pudo obtener la información del familiar.');
        this.loading.set(false);
      },
    });
  }

  selectStudent(studentId: number): void {
    this.selectedStudentId.set(studentId);
    this.courseFilter.set('ALL');
    this.loadingRecords.set(true);

    this.enrollmentService.getByStudent(studentId).subscribe({
      next: (enrollments) => {
        if (enrollments.length === 0) {
          this.records.set([]);
          this.loadingRecords.set(false);
          return;
        }
        const requests = enrollments.map((e) =>
          forkJoin({
            attendances: this.academic.getAttendances(e.id).pipe(catchError(() => of([]))),
            evaluations: this.academic.getEvaluations(e.id).pipe(catchError(() => of([]))),
          }).pipe(map((data) => this.buildRecord(e, data.attendances, data.evaluations))),
        );
        forkJoin(requests).subscribe((records) => {
          this.records.set(records.sort((a, b) => b.cycle.localeCompare(a.cycle)));
          this.loadingRecords.set(false);
        });
      },
      error: () => {
        this.error.set('No se pudieron cargar los registros académicos.');
        this.loadingRecords.set(false);
      },
    });
  }

  attendanceLabel(status: Attendance['status']): string {
    return ATTENDANCE_LABEL[status] ?? status;
  }

  enrollmentLabel(status: Enrollment['status']): string {
    return ENROLLMENT_LABEL[status] ?? status;
  }

  evaluationLabel(type: Evaluation['type']): string {
    return type === 'FINAL' ? 'Final' : 'Parcial';
  }

  private buildRecord(e: Enrollment, attendances: Attendance[], evaluations: Evaluation[]): CourseRecord {
    const attended = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const scores = evaluations.map((ev) => ev.score).filter((s) => s != null);
    return {
      enrollment: e,
      cycle: this.cycleOf(e.enrollmentDate),
      attendances: [...attendances].sort((a, b) => b.date.localeCompare(a.date)),
      evaluations: [...evaluations].sort((a, b) => b.date.localeCompare(a.date)),
      attendanceRate: attendances.length ? Math.round((attended / attendances.length) * 100) : null,
      average: scores.length ? Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10 : null,
    };
  }

  /** Ciclo académico a partir de la fecha de matrícula, ej. "2026-10". */
  private cycleOf(date: string): string {
    return date ? date.substring(0, 7) : 'Sin ciclo';
  }
}
