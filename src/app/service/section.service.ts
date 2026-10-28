import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Section } from '../model/section.model';

export interface SectionRequest {
  groupCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  totalVacancies: number;
  availableVacancies: number;
  courseId: number;
  teacherId: number;
}

@Injectable({ providedIn: 'root' })
export class SectionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.api}/sections`);
  }

  create(body: SectionRequest): Observable<Section> {
    return this.http.post<Section>(`${this.api}/sections`, body);
  }

  update(id: number, body: SectionRequest): Observable<Section> {
    return this.http.put<Section>(`${this.api}/sections/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/sections/${id}`);
  }
}