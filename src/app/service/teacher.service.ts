import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Teacher } from '../model/teacher.model';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.api}/teachers`);
  }
}