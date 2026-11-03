import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Parent, StudentParentLink } from '../model/parent.model';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Perfil del familiar autenticado. */
  getMe(): Observable<Parent> {
    return this.http.get<Parent>(`${this.api}/parents/me`);
  }

  /** Estudiantes vinculados al familiar autenticado. */
  getMyStudents(): Observable<StudentParentLink[]> {
    return this.http.get<StudentParentLink[]>(`${this.api}/parents/me/students`);
  }
}
