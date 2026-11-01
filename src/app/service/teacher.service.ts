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

  deactivate(id: number): Observable<Teacher> {
    return this.http.patch<Teacher>(`${this.api}/teachers/${id}/deactivate`, {});
  }

  getEligible(params: { courseId?: number | null; dayOfWeek?: string; startTime?: string; endTime?: string }): Observable<Teacher[]> {
    const p: Record<string, string> = {};
    if (params.courseId) p['courseId'] = String(params.courseId);
    if (params.dayOfWeek) p['dayOfWeek'] = params.dayOfWeek;
    if (params.startTime) p['startTime'] = params.startTime;
    if (params.endTime) p['endTime'] = params.endTime;
    return this.http.get<Teacher[]>(`${this.api}/teachers/eligible`, { params: p });
  }
}