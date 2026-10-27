import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SectionService } from '../../../service/section.service';
import { AuthService } from '../../../service/auth.service';
import { Section } from '../../../model/section.model';

@Component({
  selector: 'app-coordinator-home',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private sectionService = inject(SectionService);
  private auth = inject(AuthService);

  sections = signal<Section[]>([]);
  loading = signal(true);

  get userName() { return this.auth.currentUser()?.fullName ?? 'Coordinador'; }
  get totalSections() { return this.sections().length; }
  get totalVacancies() { return this.sections().reduce((a, s) => a + s.availableVacancies, 0); }
  get uniqueCourses() { return new Set(this.sections().map(s => s.courseId)).size; }

  ngOnInit() {
    this.sectionService.getAll().subscribe({
      next: (data) => { this.sections.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}