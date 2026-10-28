import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SectionService } from '../../../service/section.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';
import { Enrollment } from '../../../model/enrollment.model';

interface ProgressRow {
  student: string;
  section: string;
  average: number | null;
  levelResult: string;
}

@Component({
  selector: 'app-teacher-progreso',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css',
})
export class Progreso implements OnInit {
  private sectionService = inject(SectionService);
  private enrollmentService = inject(EnrollmentService);
  private academic = inject(AcademicService);
  private auth = inject(AuthService);

  rows = signal<ProgressRow[]>([]);
  loading = signal(true);

  ngOnInit() {
    const pid = this.profileId;
    this.sectionService.getAll().pipe(
      map((sections: Section[]) => (pid ? sections.filter((s) => s.teacherId === pid) : sections)),
      switchMap((sections: Section[]) => {
        if (sections.length === 0) return of([]);
        return forkJoin(sections.map((s) =>
          this.enrollmentService.getBySection(s.id).pipe(
            map((enrs: Enrollment[]) => enrs.map((e) => ({ enrollment: e, section: s })))
          )
        )).pipe(map((arrs) => arrs.flat()));
      }),
      switchMap((pairs: { enrollment: Enrollment; section: Section }[]) => {
        if (pairs.length === 0) return of([]);
        return forkJoin(pairs.map((p) =>
          forkJoin({
            evals: this.academic.getEvaluations(p.enrollment.id),
            levels: this.academic.getLevelEvaluations(p.enrollment.id),
          }).pipe(map(({ evals, levels }) => {
            const scores = evals.map((e) => e.score);
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
            const level = levels.length ? (levels[0].result === 'APPROVED' ? 'Aprobado' : 'Reprobado') : 'Sin evaluar';
            return {
              student: p.enrollment.studentFullName,
              section: p.section.groupCode,
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

  get profileId(): number | null {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw).profileId : null;
  }
}