import { Routes } from '@angular/router';
import { CoordinatorLayout } from '../../layout/coordinator-layout/coordinator-layout';

export const COORDINATOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinatorLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'courses',
        loadComponent: () => import('./courses/courses').then((m) => m.Courses),
      },
      {
        path: 'sections',
        loadComponent: () => import('./sections/sections').then((m) => m.Sections),
      },
      {
        path: 'teachers',
        loadComponent: () => import('./teachers/teachers').then((m) => m.Teachers),
      },
    ],
  },
];