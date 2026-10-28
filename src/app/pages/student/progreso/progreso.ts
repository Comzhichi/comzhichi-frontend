import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { AuthService } from '../../../service/auth.service';
import { Enrollment } from '../../../model/enrollment.model';

interface ProgressRow {
  course: string;
  section: string;
  average: number | null;
  levelResult: string;
}

@Component({
  selector: 'app-student-progreso',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css',
})
export class Progreso implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private academic = inject(AcademicService);
  private auth = inject(AuthService);

  rows = signal<ProgressRow[]>([]);
  loading = signal(true);

  ngOnInit() {
    const studentId = this.auth.currentUser()?.id ?? 0;
    const email = this.auth.currentUser()?.email ?? '';
    this.enrollmentService.getAll().pipe(
      map((data: Enrollment[]) => data.filter((e) =>
        (studentId && e.studentId === studentId) || (email && e.studentEmail === email)
      )),
      switchMap((enrs: Enrollment[]) => {
        if (enrs.length === 0) return of([]);
        return forkJoin(enrs.map((e) =>
          forkJoin({
            evals: this.academic.getEvaluations(e.id),
            levels: this.academic.getLevelEvaluations(e.id),
          }).pipe(map(({ evals, levels }) => {
            const scores = evals.map((x) => x.score);
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
            const level = levels.length ? (levels[0].result === 'APPROVED' ? 'Aprobado' : 'Reprobado') : 'Sin evaluar';
            return {
              course: e.courseName,
              section: e.sectionGroupCode,
              average: avg,
              levelResult: level,
            };
          }))
        ));
      })
    ).subscribe({
      next: (data) => { this.rows.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}