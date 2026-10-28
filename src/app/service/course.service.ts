import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Course, CourseRequest } from '../model/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.api}/courses`);
  }

  create(body: CourseRequest): Observable<Course> {
    return this.http.post<Course>(`${this.api}/courses`, body);
  }

  update(id: number, body: CourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.api}/courses/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/courses/${id}`);
  }
}