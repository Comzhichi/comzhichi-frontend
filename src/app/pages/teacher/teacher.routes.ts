import { Routes } from '@angular/router';
import { TeacherLayout } from '../../layout/teacher-layout/teacher-layout';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'section/:id',
        loadComponent: () => import('./section-detail/section-detail').then((m) => m.SectionDetail),
      },
      {
        path: 'horario',
        loadComponent: () => import('./horario/horario').then((m) => m.Horario),
      },
      {
        path: 'evaluaciones',
        loadComponent: () => import('./evaluaciones/evaluaciones').then((m) => m.Evaluaciones),
      },
      {
        path: 'progreso',
        loadComponent: () => import('./progreso/progreso').then((m) => m.Progreso),
      },
    ],
  },
];