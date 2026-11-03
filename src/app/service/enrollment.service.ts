import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Enrollment } from '../model/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.api}/enrollments`);
  }

  getBySection(sectionId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.api}/enrollments`, { params: { sectionId } });
  }

  getByStudent(studentId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.api}/enrollments`, { params: { studentId } });
  }

  create(body: { sectionId: number; studentId: number; enrollmentDate?: string; status?: string }): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.api}/enrollments`, body);
  }

  drop(enrollmentId: number): Observable<Enrollment> {
    return this.http.patch<Enrollment>(`${this.api}/enrollments/${enrollmentId}/drop`, {});
  }

  transfer(enrollmentId: number, newSectionId: number): Observable<Enrollment> {
    return this.http.patch<Enrollment>(
      `${this.api}/enrollments/${enrollmentId}/transfer?newSectionId=${newSectionId}`,
      {}
    );
  }
}