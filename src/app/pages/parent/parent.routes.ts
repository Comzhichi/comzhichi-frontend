import { Routes } from '@angular/router';
import { ParentLayout } from '../../layout/parent-layout/parent-layout';
export const PARENT_ROUTES: Routes = [
  {
    path: '',
    component: ParentLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
    ],
  },
];