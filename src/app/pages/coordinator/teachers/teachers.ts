import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeacherService } from '../../../service/teacher.service';
import { Teacher } from '../../../model/teacher.model';

@Component({
  selector: 'app-teachers',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css',
})
export class Teachers implements OnInit {
  private teacherService = inject(TeacherService);
  teachers = signal<Teacher[]>([]);
  loading  = signal(true);

  ngOnInit() {
    this.teacherService.getAll().subscribe({
      next: (d) => { this.teachers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}