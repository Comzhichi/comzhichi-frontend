import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Section } from '../model/section.model';

@Injectable({ providedIn: 'root' })
export class SectionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.api}/sections`);
  }
}