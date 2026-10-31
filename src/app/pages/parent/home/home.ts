import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-parent-home',
  imports: [MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private auth = inject(AuthService);
  get userName() { return this.auth.currentUser()?.fullName ?? 'Apoderado'; }
}
