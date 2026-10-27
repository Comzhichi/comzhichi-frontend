import { Routes } from '@angular/router';
import { roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'student',
    canActivate: [roleGuard('STUDENT')],
    loadChildren: () =>
      import('./pages/student/student.routes').then((m) => m.STUDENT_ROUTES),
  },
  {
    path: 'teacher',
    canActivate: [roleGuard('TEACHER')],
    loadChildren: () =>
      import('./pages/teacher/teacher.routes').then((m) => m.TEACHER_ROUTES),
  },
  {
    path: 'coordinator',
    canActivate: [roleGuard('COORDINATOR')],
    loadChildren: () =>
      import('./pages/coordinator/coordinator.routes').then((m) => m.COORDINATOR_ROUTES),
  },
  {
    path: 'parent',
    canActivate: [roleGuard('PARENT')],
    loadChildren: () =>
      import('./pages/parent/parent.routes').then((m) => m.PARENT_ROUTES),
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' },
];