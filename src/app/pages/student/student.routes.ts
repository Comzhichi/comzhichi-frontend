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
    ],
  },
];