import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-parent-layout',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  templateUrl: './parent-layout.html',
  styleUrl: './parent-layout.css',
})
export class ParentLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}