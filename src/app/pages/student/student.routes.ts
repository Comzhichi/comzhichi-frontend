import { Routes } from '@angular/router';
import { studentOnboardingGuard } from '../../guards/auth.guard';
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
        canActivate: [studentOnboardingGuard],
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
      {
        path: 'horarios',
        loadComponent: () => import('./horarios/horarios').then((m) => m.Horarios),
      },
      {
        path: 'progreso',
        loadComponent: () => import('./progreso/progreso').then((m) => m.Progreso),
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./notificaciones/notificaciones').then((m) => m.Notificaciones),
      },
      {
        path: 'ajustes',
        loadComponent: () => import('../settings/settings').then((m) => m.Settings),
      },
      {
        path: 'ayuda',
        loadComponent: () => import('../help-center/help-center').then((m) => m.HelpCenter),
      },
    ],
  },
];
