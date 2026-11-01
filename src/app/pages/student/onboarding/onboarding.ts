import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { markOnboardingCompleted } from '../../../util/onboarding-flag';
import { Section } from '../../../model/section.model';

interface CourseOption {
  name: string;
  level: string;
  section: string;
  description: string;
  shift: string;
  shifts: string[];
}

type Sufficiency =
  | 'insufficientGrade'
  | 'insufficientAttendance'
  | 'insufficientBoth'
  | 'sufficient';

function shiftOf(time: string): string {
  const m = (time || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const mins = +m[1] * 60 + +m[2];
  if (mins < 12 * 60) return 'Manana';
  if (mins < 18 * 60) return 'Tarde';
  return 'Noche';
}

@Component({
  selector: 'app-student-onboarding',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding implements OnInit {
  private router = inject(Router);
  private sectionService = inject(SectionService);
  private auth = inject(AuthService);

  step = signal(1);
  totalSteps = 3;

  // Q1
  hadCourse = signal<boolean | null>(null);

  // Q2
  searchQuery = signal('');
  shiftFilter = signal('');
  selectedCourse = signal<CourseOption | null>(null);
  sections = signal<Section[]>([]);

  courses = computed<CourseOption[]>(() => {
    const byName = new Map<string, CourseOption>();
    for (const s of this.sections()) {
      const shift = shiftOf(s.startTime);
      const existing = byName.get(s.courseName);
      if (existing) {
        // Un curso puede tener varias secciones: se conserva solo la primera, pero
        // se registran todos sus turnos para que el filtro siga funcionando.
        if (shift && !existing.shifts.includes(shift)) existing.shifts.push(shift);
        continue;
      }
      byName.set(s.courseName, {
        name: s.courseName,
        level: s.courseLevel ?? '—',
        section: s.groupCode,
        description: s.teacherSpecialty ?? '—',
        shift: shift,
        shifts: shift ? [shift] : [],
      });
    }
    return [...byName.values()];
  });

  filteredCourses = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const shift = this.shiftFilter();
    return this.courses().filter((c) => {
      const matchName =
        !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchShift = !shift || c.shifts.includes(shift);
      return matchName && matchShift;
    });
  });

  // Q3
  grade = signal('');
  attendance = signal('');
  sufficiency = signal<Sufficiency | null>(null);

  // Minimos de aprobacion sobre la escala 0-100.
  private readonly gradeMin = 60;
  private readonly attendanceMin = 70;

  // validation
  gradeError = signal('');
  attendanceError = signal('');

  ngOnInit(): void {
    this.sectionService.getAll().subscribe({
      next: (data) => this.sections.set(data),
      error: () => this.sections.set([]),
    });
  }

  selectQ1(value: boolean): void {
    this.hadCourse.set(value);
  }

  continueQ1(): void {
    if (this.hadCourse() === null) return;
    if (this.hadCourse() === false) {
      this.step.set(3);
    } else {
      this.step.set(2);
    }
  }

  selectCourse(course: CourseOption): void {
    this.selectedCourse.set(course);
  }

  onGradeInput(value: string): void {
    this.grade.set(value);
    this.gradeError.set(this.rangeError(value, 100, 'Calificacion'));
  }

  onAttendanceInput(value: string): void {
    this.attendance.set(value);
    this.attendanceError.set(this.rangeError(value, 100, 'Asistencia'));
  }

  /** Devuelve un mensaje de error si el valor no es un numero entre 0 y `max`. */
  private rangeError(value: string, max: number, label: string): string {
    const raw = value.trim();
    if (!raw) return '';
    const num = Number(raw);
    return isNaN(num) || num < 0 || num > max
      ? `${label} invalida. Debe estar entre 0 y ${max}.`
      : '';
  }

  skipCourse(): void {
    this.selectedCourse.set(null);
    this.step.set(3);
  }

  confirmCourse(): void {
    this.step.set(3);
  }

  /** Evalua el paso 3: si los datos son coherentes y que le falta al estudiante para avanzar. */
  private q3Check(): { valid: boolean; message: string } {
    const gRaw = this.grade().trim();
    const aRaw = this.attendance().trim();
    const suff = this.sufficiency();

    if (this.rangeError(gRaw, 100, 'Calificacion') || this.rangeError(aRaw, 100, 'Asistencia')) {
      return { valid: false, message: '' };
    }

    if (!gRaw && !aRaw) {
      return suff === null
        ? {
            valid: false,
            message:
              'Ingresa tu calificacion y tu asistencia, o indica si eran suficientes para aprobar.',
          }
        : { valid: true, message: '' };
    }

    if (!gRaw || !aRaw) {
      return {
        valid: false,
        message: 'Completa ambos campos, o dejalos vacios y selecciona una opcion.',
      };
    }

    const gradeLow = Number(gRaw) < this.gradeMin;
    const attendanceLow = Number(aRaw) < this.attendanceMin;
    const expected: Sufficiency =
      gradeLow && attendanceLow
        ? 'insufficientBoth'
        : gradeLow
          ? 'insufficientGrade'
          : attendanceLow
            ? 'insufficientAttendance'
            : 'sufficient';

    if (suff === null) {
      return {
        valid: false,
        message: 'Selecciona la opcion que describe si estos valores alcanzaron para aprobar.',
      };
    }
    if (suff !== expected) {
      return { valid: false, message: this.mismatchMessage(expected) };
    }
    return { valid: true, message: '' };
  }

  private mismatchMessage(expected: Sufficiency): string {
    const labels: Record<Sufficiency, string> = {
      insufficientGrade: 'Mi calificacion final no fue la suficiente',
      insufficientAttendance: 'Mi asistencia final no fue la suficiente',
      insufficientBoth: 'Ni mi calificacion ni mi asistencia fueron suficientes',
      sufficient: 'Mi calificacion y asistencia finales fueron las suficientes',
    };
    const detail =
      expected === 'insufficientBoth'
        ? `Tu calificacion esta bajo el minimo de ${this.gradeMin} y tu asistencia bajo el ${this.attendanceMin}%`
        : expected === 'insufficientGrade'
          ? `Tu calificacion esta bajo el minimo de ${this.gradeMin}`
          : expected === 'insufficientAttendance'
            ? `Tu asistencia esta bajo el minimo de ${this.attendanceMin}%`
            : `Tus valores superan los minimos (${this.gradeMin} y ${this.attendanceMin}%)`;
    return `${detail}. Selecciona "${labels[expected]}".`;
  }

  q3Hint = computed(() => {
    const result = this.q3Check();
    return result.valid ? '' : result.message;
  });

  validateQ3(): boolean {
    this.gradeError.set(this.rangeError(this.grade().trim(), 100, 'Calificacion'));
    this.attendanceError.set(this.rangeError(this.attendance().trim(), 100, 'Asistencia'));
    return this.q3Check().valid;
  }

  canContinueQ3(): boolean {
    return this.q3Check().valid;
  }

  confirmAnswers(): void {
    if (!this.validateQ3()) return;
    const payload = {
      hadCourse: this.hadCourse(),
      course: this.selectedCourse(),
      grade: this.grade().trim() || null,
      attendance: this.attendance().trim() || null,
      sufficiency: this.sufficiency(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('comzhichi_onboarding_answers', JSON.stringify(payload));
      localStorage.setItem('comzhichi_onboarding_done', 'true');
    } catch {
      /* ignore */
    }
    markOnboardingCompleted(this.auth.currentUser()?.email);
    this.step.set(4);
  }

  finishNoCourse(): void {
    try {
      localStorage.setItem(
        'comzhichi_onboarding_answers',
        JSON.stringify({ hadCourse: false, savedAt: new Date().toISOString() }),
      );
      localStorage.setItem('comzhichi_onboarding_done', 'true');
    } catch {
      /* ignore */
    }
    markOnboardingCompleted(this.auth.currentUser()?.email);
    this.step.set(4);
  }

  goToPrerequisites(): void {
    this.router.navigateByUrl('/student/prerequisites');
  }
}
