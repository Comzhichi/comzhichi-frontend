import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-parent-home',
  imports: [MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private auth = inject(AuthService);
  get userName() { return this.auth.currentUser()?.fullName ?? 'Apoderado'; }
}
