import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Role } from '../model/auth.model';

export function roleGuard(allowedRole: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const role = auth.getRole();
    if (role !== allowedRole) {
      // Redirigir al home correcto según su rol real
      const homeMap: Record<Role, string> = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        COORDINATOR: '/coordinator',
        PARENT: '/parent',
      };
      router.navigate([homeMap[role!] ?? '/auth/login']);
      return false;
    }

    return true;
  };
}