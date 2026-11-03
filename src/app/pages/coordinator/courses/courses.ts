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
import { CourseService } from '../../../service/course.service';
import { AuthService } from '../../../service/auth.service';
import { Course } from '../../../model/course.model';
import { LanguageFlagPipe } from '../../../util/language-flag.pipe';
import { LanguageColorPipe } from '../../../util/language-color.pipe';

@Component({
  selector: 'app-courses',
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule,
    MatIconModule, MatProgressSpinnerModule, LanguageFlagPipe, LanguageColorPipe,
  ],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  private courseService = inject(CourseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  courses = signal<Course[]>([]);
  loading = signal(true);
  editingId = signal<number | null>(null);
  showForm = signal(false);

  get profileId(): number {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw).profileId : 1;
  }

  form = this.fb.nonNullable.group({
    name:         ['', Validators.required],
    language:     ['', Validators.required],
    level:        ['', Validators.required],
    description:  ['', Validators.required],
    prerequisiteId: [null as number | null],
  });

  ngOnInit() { this.load(); }

  private load() {
    this.courseService.getAll().subscribe({
      next: (data) => { this.courses.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  edit(c: Course) {
    this.editingId.set(c.id);
    this.form.setValue({
      name: c.name,
      language: c.language,
      level: c.level,
      description: c.description,
      prerequisiteId: c.prerequisiteId,
    });
    this.showForm.set(true);
  }

  cancel() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { ...v, coordinatorId: this.profileId };
    const id = this.editingId();
    const req = id
      ? this.courseService.update(id, body)
      : this.courseService.create(body);

    req.subscribe({
      next: () => {
        this.snack.open(id ? 'Curso actualizado' : 'Curso creado', 'Cerrar', { duration: 3000 });
        this.cancel();
        this.load();
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  delete(c: Course) {
    if (!confirm(`¿Eliminar "${c.name}"?`)) return;
    this.courseService.delete(c.id).subscribe({
      next: () => {
        this.courses.update(list => list.filter(x => x.id !== c.id));
        this.snack.open('Curso eliminado', 'Cerrar', { duration: 3000 });
      },
      error: (e) => this.snack.open(e.error?.message ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }
}