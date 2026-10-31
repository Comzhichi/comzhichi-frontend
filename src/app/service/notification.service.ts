import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppNotification } from '../model/parent.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getMine(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.api}/notifications/me`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/notifications/${id}/read`, {});
  }
}
