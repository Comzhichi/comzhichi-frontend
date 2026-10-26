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
import { messageOf } from '../../../util/error-message';

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
            await this.router.navigateByUrl(url);
          } catch (e) {
            this.error.set(messageOf(e));
          }
        },
        onInvalid: () => {
          this.error.set('Revisa los campos del formulario');
        },
      },
    },
  );
}