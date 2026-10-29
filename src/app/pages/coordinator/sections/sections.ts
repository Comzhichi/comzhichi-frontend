import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SectionService } from '../../../service/section.service';
import { CourseService } from '../../../service/course.service';
import { TeacherService } from '../../../service/teacher.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { Section } from '../../../model/section.model';
import { Course } from '../../../model/course.model';
import { Teacher } from '../../../model/teacher.model';
import { Enrollment } from '../../../model/enrollment.model';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';

const DAYS = [
  { value: 'MONDAY',    label: 'Lunes' },
  { value: 'TUESDAY',   label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY',  label: 'Jueves' },
  { value: 'FRIDAY',    label: 'Viernes' },
  { value: 'SATURDAY',  label: 'Sábado' },
];

@Component({
  selector: 'app-sections',
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule,
    MatIconModule, MatProgressSpinnerModule, MatCheckboxModule,
    LanguageFlagPipe, LanguageColorPipe,
  ],
  templateUrl: './sections.html',
  styleUrl: './sections.css',
})
export class Sections implements OnInit {
  private sectionService    = inject(SectionService);
  private courseService     = inject(CourseService);
  private teacherService    = inject(TeacherService);
  private enrollmentService = inject(EnrollmentService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  sections = signal<Section[]>([]);
  courses  = signal<Course[]>([]);
  teachers = signal<Teacher[]>([]);
  loading  = signal(true);
  editingId = signal<number | null>(null);
  showForm  = signal(false);
  readonly days = DAYS;
  selectedDays = signal<string[]>([]);

  // Panel de matrículas
  selectedSection    = signal<Section | null>(null);
  enrollments        = signal<Enrollment[]>([]);
  loadingEnrollments = signal(false);

  // Transferencia
  transferingId       = signal<number | null>(null);
  sectionsForTransfer = signal<Section[]>([]);

  form = this.fb.nonNullable.group({
    groupCode:       ['', Validators.required],
    startTime:       ['', Validators.required],
    endTime:         ['', Validators.required],
    classroom:       ['', Validators.required],
    totalVacancies:  [20, [Validators.required, Validators.min(1)]],
    courseId:        [null as number | null, Validators.required],
    teacherId:       [null as number | null, Validators.required],
  });

  ngOnInit() {
    this.sectionService.getAll().subscribe(d => { this.sections.set(d); this.loading.set(false); });
    this.courseService.getAll().subscribe(d => this.courses.set(d));
    this.teacherService.getAll().subscribe(d => this.teachers.set(d));
  }

  toggleDay(day: string) {
    const current = this.selectedDays();
    this.selectedDays.set(
      current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    );
  }

  isDaySelected(day: string) { return this.selectedDays().includes(day); }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({ totalVacancies: 20 });
    this.selectedDays.set([]);
    this.showForm.set(true);
  }

  edit(s: Section) {
    this.editingId.set(s.id);
    this.selectedDays.set(s.dayOfWeek.split(',').map(d => d.trim()));
    this.form.setValue({
      groupCode:      s.groupCode,
      startTime:      s.startTime,
      endTime:        s.endTime,
      classroom:      s.classroom,
      totalVacancies: s.totalVacancies,
      courseId:       s.courseId,
      teacherId:      s.teacherId,
    });
    this.showForm.set(true);
  }

  cancel() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset({ totalVacancies: 20 });
    this.selectedDays.set([]);
  }

  save() {
    if (this.form.invalid || this.selectedDays().length === 0) {
      this.snack.open('Completa todos los campos y selecciona al menos un día', 'Cerrar', { duration: 3000 });
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      groupCode:          v.groupCode,
      dayOfWeek:          this.selectedDays().join(','),
      startTime:          v.startTime,
      endTime:            v.endTime,
      classroom:          v.classroom,
      totalVacancies:     v.totalVacancies,
      availableVacancies: v.totalVacancies,
      courseId:           v.courseId!,
      teacherId:          v.teacherId!,
    };
    const id = this.editingId();
    const req = id
      ? this.sectionService.update(id, body)
      : this.sectionService.create(body);

    req.subscribe({
      next: () => {
        this.snack.open(id ? 'Sección actualizada' : 'Sección creada', 'Cerrar', { duration: 3000 });
        this.cancel();
        this.sectionService.getAll().subscribe(d => this.sections.set(d));
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  delete(s: Section) {
    if (!confirm(`¿Eliminar sección "${s.groupCode}"?`)) return;
    this.sectionService.delete(s.id).subscribe({
      next: () => this.sections.update(list => list.filter(x => x.id !== s.id)),
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  // ── Panel de matrículas ──
  viewEnrollments(s: Section) {
    this.selectedSection.set(s);
    this.loadingEnrollments.set(true);
    this.closeTransfer();
    this.enrollmentService.getBySection(s.id).subscribe(data => {
      this.enrollments.set(data.filter(e => e.status === 'ACTIVE'));
      this.loadingEnrollments.set(false);
    });
  }

  closeEnrollments() {
    this.selectedSection.set(null);
    this.enrollments.set([]);
    this.closeTransfer();
  }

  dropEnrollment(e: Enrollment) {
    if (!confirm(`¿Dar de baja a ${e.studentFullName}?`)) return;
    this.enrollmentService.drop(e.id).subscribe({
      next: () => {
        this.enrollments.update(list => list.filter(x => x.id !== e.id));
        this.sectionService.getAll().subscribe(d => this.sections.set(d));
        this.snack.open('Baja registrada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => this.snack.open(err.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  // ── Transferencia ──
  openTransfer(e: Enrollment) {
    this.transferingId.set(e.id);
    const currentSection = this.selectedSection()!;
    const available = this.sections().filter(s =>
      s.courseId === currentSection.courseId
      && s.id !== currentSection.id
      && s.availableVacancies > 0
    );
    this.sectionsForTransfer.set(available);
  }

  closeTransfer() {
    this.transferingId.set(null);
    this.sectionsForTransfer.set([]);
  }

  confirmTransfer(newSectionId: number) {
    const enrollmentId = this.transferingId();
    if (!enrollmentId) return;

    this.enrollmentService.transfer(enrollmentId, newSectionId).subscribe({
      next: () => {
        this.snack.open('Estudiante transferido correctamente', 'Cerrar', { duration: 3000 });
        this.closeTransfer();
        const section = this.selectedSection();
        if (section) {
          this.enrollmentService.getBySection(section.id).subscribe(data => {
            this.enrollments.set(data.filter(e => e.status === 'ACTIVE'));
          });
        }
        this.sectionService.getAll().subscribe(d => this.sections.set(d));
      },
      error: (err) => this.snack.open(err.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  formatDays(days: string): string {
    const map: Record<string, string> = {
      MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
      THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb',
    };
    return days.split(',').map(d => map[d.trim()] ?? d).join(' / ');
  }
}