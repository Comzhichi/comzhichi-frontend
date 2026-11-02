import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ParentService } from '../../../service/parent.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { StudentParentLink } from '../../../model/parent.model';
import { Enrollment } from '../../../model/enrollment.model';

function dayLabel(day: string | undefined): string {
  const map: Record<string, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  };
  return map[(day || '').toUpperCase()] ?? day ?? '';
}

function timeRange(start: string | undefined, end: string | undefined): string {
  if (!start && !end) return '—';
  return `${start ?? ''}-${end ?? ''}`;
}

@Component({
  selector: 'app-parent-horarios',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class Horarios implements OnInit {
  private parentService = inject(ParentService);
  private enrollmentService = inject(EnrollmentService);

  loading = signal(true);
  loadingSchedule = signal(false);
  error = signal('');

  students = signal<StudentParentLink[]>([]);
  selectedStudentId = signal<number | null>(null);
  enrollments = signal<Enrollment[]>([]);

  displayedColumns = ['course', 'section', 'day', 'time', 'classroom', 'teacher'];

  /** Solo matrículas activas (el horario actual del estudiante). */
  activeEnrollments = computed(() =>
    this.enrollments().filter((e) => e.status === 'ACTIVE'),
  );

  ngOnInit(): void {
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
    this.loadingSchedule.set(true);
    this.enrollmentService.getByStudent(studentId).subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loadingSchedule.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los horarios del estudiante.');
        this.enrollments.set([]);
        this.loadingSchedule.set(false);
      },
    });
  }

  dayOf(e: Enrollment): string {
    return dayLabel(e.sectionDayOfWeek);
  }

  timeOf(e: Enrollment): string {
    return timeRange(e.sectionStartTime, e.sectionEndTime);
  }

  classroomOf(e: Enrollment): string {
    return e.sectionClassroom ?? e.classroom ?? '—';
  }

  teacherOf(e: Enrollment): string {
    return e.teacherName ?? '—';
  }
}
