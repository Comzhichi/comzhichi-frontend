import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../../service/teacher.service';
import { Teacher } from '../../../model/teacher.model';

@Component({
  selector: 'app-teachers',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css',
})
export class Teachers implements OnInit {
  private teacherService = inject(TeacherService);
  private snack = inject(MatSnackBar);

  teachers = signal<Teacher[]>([]);
  loading  = signal(true);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.teacherService.getAll().subscribe({
      next: (d) => { this.teachers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  deactivate(t: Teacher) {
    if (!confirm(`¿Dar de baja a ${t.userFullName}?`)) return;
    this.teacherService.deactivate(t.id).subscribe({
      next: (updated) => {
        this.teachers.update((list) => list.map((x) => (x.id === t.id ? { ...x, active: updated.active ?? false } : x)));
        this.snack.open('Profesor dado de baja', 'Cerrar', { duration: 3000 });
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  isActive(t: Teacher): boolean {
    return t.active !== false;
  }
}
