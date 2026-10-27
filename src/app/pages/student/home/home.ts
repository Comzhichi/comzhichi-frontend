import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EnrollmentService } from '../../../service/enrollment.service';
import { AuthService } from '../../../service/auth.service';
import { Enrollment } from '../../../model/enrollment.model';

@Component({
  selector: 'app-student-home',
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private auth = inject(AuthService);

  enrollments = signal<Enrollment[]>([]);
  loading = signal(true);

  get userName() {
    return this.auth.currentUser()?.fullName ?? 'Estudiante';
  }

  ngOnInit() {
    this.enrollmentService.getAll().subscribe({
      next: (data) => {
        this.enrollments.set(data.filter((e) => e.status === 'ACTIVE'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      APPROVED: 'Aprobado',
      DROPPED: 'Dado de baja',
      FAILED: 'Reprobado',
    };
    return map[status] ?? status;
  }
}
