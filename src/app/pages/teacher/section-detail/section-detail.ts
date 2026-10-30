import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { Enrollment } from '../../../model/enrollment.model';
import { Attendance, Evaluation, AcademicObservation, LevelEvaluation } from '../../../model/academic.model';

@Component({
  selector: 'app-section-detail',
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTabsModule, MatIconModule, MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './section-detail.html',
  styleUrl: './section-detail.css',
})
export class SectionDetail implements OnInit {
  private route             = inject(ActivatedRoute);
  private enrollmentService = inject(EnrollmentService);
  private academic          = inject(AcademicService);
  private fb                = inject(FormBuilder);
  private snack             = inject(MatSnackBar);

  sectionId    = 0;
  enrollments  = signal<Enrollment[]>([]);
  selected     = signal<Enrollment | null>(null);
  attendances  = signal<Attendance[]>([]);
  evaluations  = signal<Evaluation[]>([]);
  observations = signal<AcademicObservation[]>([]);
  levelEvals   = signal<LevelEvaluation[]>([]);
  loading      = signal(true);

  today = new Date().toISOString().split('T')[0];

  attendanceForm = this.fb.nonNullable.group({
    date:        [this.today, Validators.required],
    status:      ['PRESENT', Validators.required],
    observation: [''],
  });

  evaluationForm = this.fb.nonNullable.group({
    type:     ['PARTIAL', Validators.required],
    date:     [this.today, Validators.required],
    score:    [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    feedback: ['', Validators.required],
  });

  observationForm = this.fb.nonNullable.group({
    date:        [this.today, Validators.required],
    observation: ['', Validators.required],
  });

  levelForm = this.fb.nonNullable.group({
    date:     [this.today, Validators.required],
    result:   ['APPROVED', Validators.required],
    comments: ['', Validators.required],
  });

  ngOnInit() {
    this.sectionId = Number(this.route.snapshot.paramMap.get('id'));
    this.enrollmentService.getBySection(this.sectionId).subscribe({
      next: (data) => {
        // Solo mostrar estudiantes con matrícula ACTIVE
        this.enrollments.set(data.filter((e) =>
          e.sectionId === this.sectionId && e.status === 'ACTIVE'
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectEnrollment(e: Enrollment) {
    this.selected.set(e);
    const id = e.id;
    this.academic.getAttendances(id).subscribe(d => this.attendances.set(d));
    this.academic.getEvaluations(id).subscribe(d => this.evaluations.set(d));
    this.academic.getObservations(id).subscribe(d => this.observations.set(d));
    this.academic.getLevelEvaluations(id).subscribe(d => this.levelEvals.set(d));
  }

  saveAttendance() {
    if (this.attendanceForm.invalid) return;
    const v = this.attendanceForm.getRawValue();
    this.academic.createAttendance({ enrollmentId: this.selected()!.id, ...v }).subscribe({
      next: (a) => {
        this.attendances.update(l => [...l, a]);
        this.attendanceForm.reset({ date: this.today, status: 'PRESENT', observation: '' });
        this.snack.open('Asistencia registrada', 'Cerrar', { duration: 2500 });
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  saveEvaluation() {
    if (this.evaluationForm.invalid) return;
    const v = this.evaluationForm.getRawValue();
    this.academic.createEvaluation({ enrollmentId: this.selected()!.id, ...v }).subscribe({
      next: (ev) => {
        this.evaluations.update(l => [...l, ev]);
        this.evaluationForm.reset({ type: 'PARTIAL', date: this.today, score: 0, feedback: '' });
        this.snack.open('Evaluación registrada', 'Cerrar', { duration: 2500 });
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  saveObservation() {
    if (this.observationForm.invalid) return;
    const v = this.observationForm.getRawValue();
    this.academic.createObservation({ enrollmentId: this.selected()!.id, ...v }).subscribe({
      next: (ob) => {
        this.observations.update(l => [...l, ob]);
        this.observationForm.reset({ date: this.today, observation: '' });
        this.snack.open('Observación registrada', 'Cerrar', { duration: 2500 });
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  saveLevelEval() {
    if (this.levelForm.invalid) return;
    const v = this.levelForm.getRawValue();
    this.academic.createLevelEvaluation({ enrollmentId: this.selected()!.id, ...v }).subscribe({
      next: (le) => {
        this.levelEvals.update(l => [...l, le]);
        this.levelForm.reset({ date: this.today, result: 'APPROVED', comments: '' });
        this.snack.open('Evaluación de nivel registrada', 'Cerrar', { duration: 2500 });
        // Remover al estudiante de la lista ya que su matrícula pasó a APPROVED/FAILED
        this.enrollments.update(list => list.filter(e => e.id !== this.selected()!.id));
        this.selected.set(null);
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  statusLabel(s: string) {
    const m: Record<string, string> = {
      PRESENT: 'Presente', ABSENT: 'Ausente',
      LATE: 'Tardanza', JUSTIFIED: 'Justificado',
    };
    return m[s] ?? s;
  }
}