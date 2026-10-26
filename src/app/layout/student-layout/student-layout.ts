import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-student-layout',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.css',
})
export class StudentLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}