import { Routes } from '@angular/router';
import { StudentLayout } from '../../layout/student-layout/student-layout';
export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./onboarding/onboarding').then((m) => m.Onboarding),
      },
      {
        path: 'prerequisites',
        loadComponent: () => import('./prerequisites/prerequisites').then((m) => m.Prerequisites),
      },
      {
        path: 'matriculas',
        loadComponent: () => import('./matriculas/matriculas').then((m) => m.Matriculas),
      },
    ],
  },
];
