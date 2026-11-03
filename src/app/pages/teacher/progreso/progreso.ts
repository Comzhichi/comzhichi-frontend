import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SectionService } from '../../../service/section.service';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AcademicService } from '../../../service/academic.service';
import { Section } from '../../../model/section.model';
import { Enrollment } from '../../../model/enrollment.model';

interface ProgressRow {
  student: string;
  section: string;
  average: number | null;
  levelResult: string;
}

interface SectionGroup {
  section: Section;
  rows: ProgressRow[];
}

@Component({
  selector: 'app-teacher-progreso',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css',
})
export class Progreso implements OnInit {
  private sectionService    = inject(SectionService);
  private enrollmentService = inject(EnrollmentService);
  private academic          = inject(AcademicService);

  groups  = signal<SectionGroup[]>([]);
  loading = signal(true);

  ngOnInit() {
    const pid = this.profileId;
    this.sectionService.getAll().pipe(
      map((sections: Section[]) => pid ? sections.filter(s => s.teacherId === pid) : sections),
      switchMap((sections: Section[]) => {
        if (sections.length === 0) return of([{ section: null, enrollments: [] }]);
        return forkJoin(sections.map(s =>
          this.enrollmentService.getBySection(s.id).pipe(
            map((enrs: Enrollment[]) => ({
              section: s,
              enrollments: enrs.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED'),
            }))
          )
        ));
      }),
      switchMap((sectionData: { section: Section | null; enrollments: Enrollment[] }[]) => {
        const validSections = sectionData.filter(sd => sd.section !== null && sd.enrollments.length > 0);
        if (validSections.length === 0) return of([]);
        return forkJoin(validSections.map(sd =>
          forkJoin(sd.enrollments.map(e =>
            forkJoin({
              evals:  this.academic.getEvaluations(e.id),
              levels: this.academic.getLevelEvaluations(e.id),
            }).pipe(map(({ evals, levels }) => {
              const scores = evals.map(x => x.score);
              const avg = scores.length
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : null;
              const level = levels.length
                ? (levels[0].result === 'APPROVED' ? 'Aprobado' : 'Reprobado')
                : 'Sin evaluar';
              return {
                student:     e.studentFullName,
                section:     sd.section!.groupCode,
                average:     avg,
                levelResult: level,
              } as ProgressRow;
            }))
          )).pipe(map(rows => ({ section: sd.section!, rows })))
        ));
      })
    ).subscribe({
      next: (data) => { this.groups.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get profileId(): number | null {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw).profileId : null;
  }
}