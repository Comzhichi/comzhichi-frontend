import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../service/auth.service';
import { Role } from '../../model/auth.model';

interface BackendProfile {
  id?: number;
  userId?: number;
  userFullName?: string;
  userEmail?: string;
  fullName?: string;
  email?: string;
  role?: Role;
  enabled?: boolean;
  specialty?: string;
  phoneContact?: string;
  department?: string;
  active?: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Ajustes</h1>
      </div>

      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Información del usuario</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (loadingProfile) {
            <p>Cargando perfil desde el backend...</p>
          } @else if (profileError) {
            <p class="error">{{ profileError }}</p>
          } @else if (profile) {
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Nombre</span>
                <span class="value">{{ profile.userFullName || profile.fullName || user?.fullName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Correo</span>
                <span class="value">{{ profile.userEmail || profile.email || user?.email }}</span>
              </div>
              <div class="info-item">
                <span class="label">Rol</span>
                <span class="value">{{ profile.role || user?.role }}</span>
              </div>
              <div class="info-item">
                <span class="label">Estado</span>
                <span class="value">{{ (profile.enabled ?? user?.enabled) ? 'Activo' : 'Inactivo' }}</span>
              </div>
              @if (profile.specialty) {
                <div class="info-item">
                  <span class="label">Especialidad</span>
                  <span class="value">{{ profile.specialty }}</span>
                </div>
              }
              @if (profile.phoneContact) {
                <div class="info-item">
                  <span class="label">Teléfono</span>
                  <span class="value">{{ profile.phoneContact }}</span>
                </div>
              }
              @if (profile.department) {
                <div class="info-item">
                  <span class="label">Departamento</span>
                  <span class="value">{{ profile.department }}</span>
                </div>
              }
            </div>
          } @else {
            <p>No hay perfil disponible.</p>
          }
        </mat-card-content>
      </mat-card>

      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Cambiar contraseña</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="changePassword()" #f="ngForm">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Contraseña actual</mat-label>
              <input matInput type="password" [(ngModel)]="currentPassword" name="currentPassword" required />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Nueva contraseña</mat-label>
              <input matInput type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="6" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Confirmar nueva contraseña</mat-label>
              <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required />
            </mat-form-field>

            @if (passwordError) {
              <p class="error">{{ passwordError }}</p>
            }

            <button matButton="filled" type="submit" [disabled]="changingPassword">
              {{ changingPassword ? 'Guardando...' : 'Cambiar contraseña' }}
            </button>
          </form>

          @if (passwordChanged) {
            <p class="success">Contraseña actualizada correctamente.</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .full { width: 100%; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 12px; color: var(--color-text); opacity: 0.7; }
    .value { font-size: 16px; font-weight: 500; }
    .error { color: var(--color-error); margin-bottom: 12px; }
    .success { color: var(--color-secondary); margin-top: 12px; }
    .card { margin-bottom: 24px; }
  `],
})
export class Settings implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  user = this.auth.currentUser();
  profile: BackendProfile | null = null;
  loadingProfile = true;
  profileError = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordChanged = false;
  changingPassword = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const role = this.user?.role;
    const endpoint = this.profileEndpoint(role);
    if (!endpoint) {
      this.loadingProfile = false;
      this.profileError = 'No se pudo determinar el perfil del usuario.';
      return;
    }
    this.http.get<BackendProfile>(`${environment.apiUrl}${endpoint}`).subscribe({
      next: (data) => {
        this.profile = data;
        this.loadingProfile = false;
      },
      error: (err) => {
        this.profileError = err?.error?.message || 'No se pudo cargar el perfil desde el backend.';
        this.loadingProfile = false;
      },
    });
  }

  private profileEndpoint(role?: Role): string | null {
    switch (role) {
      case 'STUDENT':
        return '/students/me';
      case 'TEACHER':
        return '/teachers/me';
      case 'PARENT':
        return '/parents/me';
      case 'COORDINATOR':
        return '/coordinators/me';
      default:
        return null;
    }
  }

  async changePassword(): Promise<void> {
    this.passwordError = '';
    this.passwordChanged = false;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Todos los campos son obligatorios.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }

    this.changingPassword = true;
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/change-password`, {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      }, { responseType: 'text' }));
      this.passwordChanged = true;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.snack.open('Contraseña actualizada', 'Cerrar', { duration: 3000 });
    } catch (err: any) {
      this.passwordError = err?.error?.message || err?.message || 'No se pudo cambiar la contraseña en el backend.';
      this.snack.open(this.passwordError, 'Cerrar', { duration: 4000 });
    } finally {
      this.changingPassword = false;
    }
  }
}
