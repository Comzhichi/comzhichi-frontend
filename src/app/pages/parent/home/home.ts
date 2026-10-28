import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-parent-home',
  imports: [MatCardModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home { 
  private auth = inject(AuthService);
  get userName() { return this.auth.currentUser()?.fullName ?? 'Apoderado'; }
}