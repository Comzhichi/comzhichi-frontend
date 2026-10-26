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
    ],
  },
];