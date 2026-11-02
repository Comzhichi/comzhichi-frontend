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
      {
        path: 'seguimiento',
        loadComponent: () => import('./seguimiento/seguimiento').then((m) => m.Seguimiento),
      },
      {
        path: 'horarios',
        loadComponent: () => import('./horarios/horarios').then((m) => m.Horarios),
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
