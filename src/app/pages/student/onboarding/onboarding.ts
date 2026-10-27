import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { SectionService } from '../../../service/section.service';
import { Section } from '../../../model/section.model';

interface CourseOption {
  name: string;
  level: string;
  section: string;
  description: string;
  shift: string;
}

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

  step = signal(1);
  totalSteps = 3;

  // Q1
  hadCourse = signal<boolean | null>(null);

  // Q2
  searchQuery = signal('');
  shiftFilter = signal('');
  selectedCourse = signal<CourseOption | null>(null);
  sections = signal<Section[]>([]);

  courses = computed<CourseOption[]>(() =>
    this.sections().map((s) => ({
      name: s.courseName,
      level: s.courseLevel ?? '—',
      section: s.groupCode,
      description: s.teacherSpecialty ?? '—',
      shift: shiftOf(s.startTime),
    })),
  );

  filteredCourses = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const shift = this.shiftFilter();
    return this.courses().filter((c) => {
      const matchName =
        !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchShift = !shift || c.shift === shift;
      return matchName && matchShift;
    });
  });

  // Q3
  grade = signal('');
  attendance = signal('');
  sufficiency = signal<'insufficientGrade' | 'insufficientAttendance' | 'sufficient' | null>(null);

  // validation
  submitted = signal(false);
  gradeError = signal('');
  attendanceError = signal('');
  generalError = signal('');

  progress = computed(() => {
    if (this.step() >= 4) return 100;
    return Math.round((this.step() / this.totalSteps) * 100);
  });

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

  skipCourse(): void {
    this.selectedCourse.set(null);
    this.step.set(3);
  }

  confirmCourse(): void {
    this.step.set(3);
  }

  private isQ3Valid(): boolean {
    const gRaw = this.grade().trim();
    const aRaw = this.attendance().trim();
    const suff = this.sufficiency();

    if (gRaw) {
      const gNum = Number(gRaw);
      if (isNaN(gNum) || gNum < 0 || gNum > 20) return false;
    }
    if (aRaw) {
      const aNum = Number(aRaw);
      if (isNaN(aNum) || aNum < 0 || aNum > 100) return false;
    }

    if (gRaw && aRaw) {
      const gNum = Number(gRaw);
      const aNum = Number(aRaw);
      if (gNum < 11 && suff !== 'insufficientGrade') return false;
      if (aNum < 70 && suff !== 'insufficientAttendance') return false;
      return true;
    }

    if (suff !== null) {
      if ((gRaw && !aRaw) || (!gRaw && aRaw)) return false;
      return true;
    }

    return false;
  }

  validateQ3(): boolean {
    this.gradeError.set('');
    this.attendanceError.set('');
    this.generalError.set('');

    const gRaw = this.grade().trim();
    const aRaw = this.attendance().trim();
    const suff = this.sufficiency();

    if (gRaw) {
      const gNum = Number(gRaw);
      if (isNaN(gNum) || gNum < 0 || gNum > 20) {
        this.gradeError.set('Calificacion invalida (0-20).');
        return false;
      }
    }
    if (aRaw) {
      const aNum = Number(aRaw);
      if (isNaN(aNum) || aNum < 0 || aNum > 100) {
        this.attendanceError.set('Asistencia invalida (0-100%).');
        return false;
      }
    }

    if (gRaw && aRaw) {
      const gNum = Number(gRaw);
      const aNum = Number(aRaw);
      if (gNum < 11 && suff !== 'insufficientGrade') {
        this.generalError.set(
          'Tu calificacion parece insuficiente. Confirma esa condicion en las opciones.',
        );
        return false;
      }
      if (aNum < 70 && suff !== 'insufficientAttendance') {
        this.generalError.set(
          'Tu asistencia parece insuficiente. Confirma esa condicion en las opciones.',
        );
        return false;
      }
      return true;
    }

    if (suff !== null) {
      if ((gRaw && !aRaw) || (!gRaw && aRaw)) {
        this.generalError.set('Completa ambos campos o selecciona una opcion de suficiencia.');
        return false;
      }
      return true;
    }

    this.generalError.set(
      'Indica la calificacion y asistencia o selecciona una opcion de suficiencia.',
    );
    return false;
  }

  canContinueQ3(): boolean {
    return this.isQ3Valid();
  }

  confirmAnswers(): void {
    this.submitted.set(true);
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
    this.step.set(4);
  }

  goToPrerequisites(): void {
    this.router.navigateByUrl('/student/prerequisites');
  }
}
