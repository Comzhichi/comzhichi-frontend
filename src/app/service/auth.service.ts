import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, UserRequest } from '../model/auth.model';

const TOKEN_KEY = 'comzhichi_token';
const USER_KEY = 'comzhichi_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  readonly currentUser = signal<AuthResponse['user'] | null>(this.readUser());
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto).pipe(
      tap((res) => this.persist(res))
    );
  }

  register(dto: UserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, dto).pipe(      tap((res) => this.persist(res))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('session');
    this.token.set(null);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return this.token();
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getRole(): AuthResponse['user']['role'] | null {
    return this.currentUser()?.role ?? null;
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    localStorage.setItem('session', JSON.stringify(res));
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }

  private readUser(): AuthResponse['user'] | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse['user'];
    } catch {
      return null;
    }
  }
}