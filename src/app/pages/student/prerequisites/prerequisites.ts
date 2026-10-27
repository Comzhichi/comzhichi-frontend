import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-student-prerequisites',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './prerequisites.html',
  styleUrl: './prerequisites.css',
})
export class Prerequisites {}
