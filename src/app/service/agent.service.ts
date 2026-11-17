import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Re-export for convenience
export type { ChatResponse } from '../model/agent.model';
import { ChatResponse } from '../model/agent.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  chat(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.api}/agent/chat`, { message });
  }
}