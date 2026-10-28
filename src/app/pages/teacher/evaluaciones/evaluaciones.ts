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

interface EvalRow {
  student: string;
  section: string;
  type: string;
  date: string;
  score: number;
  feedback: string;
}

@Component({
  selector: 'app-teacher-evaluaciones',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './evaluaciones.html',
  styleUrl: './evaluaciones.css',
})
export class Evaluaciones implements OnInit {
  private sectionService = inject(SectionService);
  private enrollmentService = inject(EnrollmentService);
  private academic = inject(AcademicService);
  private auth = inject(AuthService);

  rows = signal<EvalRow[]>([]);
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
          this.academic.getEvaluations(p.enrollment.id).pipe(
            map((evs) => evs.map((ev) => ({
              student: p.enrollment.studentFullName,
              section: p.section.groupCode,
              type: ev.type,
              date: ev.date,
              score: ev.score,
              feedback: ev.feedback,
            })))
          )
        )).pipe(map((arrs) => arrs.flat()));
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