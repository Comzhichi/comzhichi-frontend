import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Role } from '../model/auth.model';
import { isOnboardingCompleted } from '../util/onboarding-flag';

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

/**
 * El onboarding solo se puede completar la primera vez que una cuenta de estudiante
 * inicia sesión. Una vez completado, la ruta vuelve al dashboard.
 */
export function studentOnboardingGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!auth.isAuthenticated() || user?.role !== 'STUDENT') {
      router.navigate(['/auth/login']);
      return false;
    }

    if (isOnboardingCompleted(user?.email)) {
      router.navigate(['/student']);
      return false;
    }

    return true;
  };
}