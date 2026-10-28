import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Attendance, Evaluation,
  AcademicObservation, LevelEvaluation
} from '../model/academic.model';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  // Attendances
  getAttendances(enrollmentId: number): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.api}/attendances`, { params: { enrollmentId } });
  }
  createAttendance(body: { enrollmentId: number; date: string; status: string; observation: string }): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.api}/attendances`, body);
  }

  // Evaluations
  getEvaluations(enrollmentId: number): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.api}/evaluations`, { params: { enrollmentId } });
  }
  createEvaluation(body: { enrollmentId: number; type: string; date: string; score: number; feedback: string }): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.api}/evaluations`, body);
  }

  // Observations
  getObservations(enrollmentId: number): Observable<AcademicObservation[]> {
    return this.http.get<AcademicObservation[]>(`${this.api}/academic-observations`, { params: { enrollmentId } });
  }
  createObservation(body: { enrollmentId: number; date: string; observation: string }): Observable<AcademicObservation> {
    return this.http.post<AcademicObservation>(`${this.api}/academic-observations`, body);
  }

  // Level evaluations
  getLevelEvaluations(enrollmentId: number): Observable<LevelEvaluation[]> {
    return this.http.get<LevelEvaluation[]>(`${this.api}/level-evaluations`, { params: { enrollmentId } });
  }
  createLevelEvaluation(body: { enrollmentId: number; date: string; result: string; comments: string }): Observable<LevelEvaluation> {
    return this.http.post<LevelEvaluation>(`${this.api}/level-evaluations`, body);
  }
}