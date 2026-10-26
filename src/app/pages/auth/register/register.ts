import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Role } from '../../../model/auth.model';
import { AuthService } from '../../../service/auth.service';
import { messageOf } from '../../../util/error-message';

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  error = signal('');
  roles: { value: Role; label: string }[] = [
    { value: 'STUDENT', label: 'Estudiante' },
    { value: 'TEACHER', label: 'Docente' },
    { value: 'COORDINATOR', label: 'Coordinador' },
    { value: 'PARENT', label: 'Padre/Madre' },
  ];
  registerModel = signal({
    role: 'STUDENT' as Role,
    fullName: '',
    email: '',
    password: '',
    specialty: '',
    department: '',
    phoneContact: '',
  });
  registerForm = form(
    this.registerModel,
    (path) => {
      required(path.fullName, { message: 'El nombre es obligatorio' });
      required(path.email, { message: 'El email es obligatorio' });
      email(path.email, { message: 'Email no válido' });
      required(path.password, { message: 'La contraseña es obligatoria' });
      minLength(path.password, 6, { message: 'Mínimo 6 caracteres' });
    },
    {
      submission: {
        action: async () => {
          this.error.set('');
          const m = this.registerModel();
          try {
            await firstValueFrom(
              this.auth.register({
                fullName: m.fullName,
                email: m.email,
                password: m.password,
                role: m.role,
                specialty: m.specialty || undefined,
                department: m.department || undefined,
                phoneContact: m.phoneContact || undefined,
              }),
            );
            this.snackBar.open('Cuenta creada. Ahora inicia sesión', 'Cerrar', { duration: 4000 });
            this.router.navigateByUrl('/auth/login');
          } catch (e) {
            this.error.set(messageOf(e));
          }
        },
      },
    },
  );
}