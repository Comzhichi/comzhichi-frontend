import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
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
    return this.getMe().pipe(
      switchMap((parent) =>
        this.http
          .get<StudentParentLink[]>(`${this.api}/student-parents`)
          .pipe(map((links) => links.filter((l) => l.parentId === parent.id))),
      ),
    );
  }
}
