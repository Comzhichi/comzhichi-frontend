import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-coordinator-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatListModule, MatToolbarModule, MatButtonModule],
  templateUrl: './coordinator-layout.html',
  styleUrl: './coordinator-layout.css',
})
export class CoordinatorLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}