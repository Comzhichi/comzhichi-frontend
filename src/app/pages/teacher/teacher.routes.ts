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
    ],
  },
];