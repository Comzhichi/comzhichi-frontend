import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Enrollment } from '../model/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.api}/enrollments`);
  }
}