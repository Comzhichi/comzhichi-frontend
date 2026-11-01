import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../service/auth.service';
import { getErrorMessage } from '../../../util/error-message';
import { isOnboardingCompleted } from '../../../util/onboarding-flag';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  loginModel = signal({ email: '', password: '' });
  loginForm = form(
    this.loginModel,
    (path) => {
      required(path.email, { message: 'El email es obligatorio' });
      email(path.email, { message: 'Email no válido' });
      required(path.password, { message: 'La contraseña es obligatoria' });
    },
    {
      submission: {
        action: async () => {
          this.error.set('');
          try {
            const res = await firstValueFrom(this.auth.login(this.loginModel()));
            const target: Record<string, string> = {
              STUDENT: '/student',
              TEACHER: '/teacher',
              COORDINATOR: '/coordinator',
              PARENT: '/parent',
            };
            const url = target[res.user.role] ?? '/auth/login';
            // Un estudiante nuevo entra al onboarding en su primer inicio de sesión
            const destination =
              res.user.role === 'STUDENT' && !isOnboardingCompleted(res.user.email)
                ? '/student/onboarding'
                : url;
            await this.router.navigateByUrl(destination);
          } catch (e) {
            console.error('Login error:', e);
            this.error.set(getErrorMessage(e));
          }
        },
        onInvalid: () => {
          this.error.set('Revisa los campos del formulario');
        },
      },
    },
  );
}