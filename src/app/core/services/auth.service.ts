import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { AUTH_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, unwrapApiData } from '../models/api-response.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface AuthSession {
  user: User;
  accessToken?: string;
  csrfToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authenticated = false;

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(this.authUrl(AUTH_ENDPOINTS.login), credentials, {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        tap(() => (this.authenticated = true)),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        this.authUrl(AUTH_ENDPOINTS.logout),
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(tap(() => (this.authenticated = false)));
  }

  requestPasswordRecovery(email: string): Observable<void> {
    const request: PasswordRecoveryRequest = { email };

    return this.http
      .post<ApiResponse<{ accepted: boolean }>>(this.authUrl(AUTH_ENDPOINTS.forgotPassword), request, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  hasValidSession(): Observable<boolean> {
    if (this.authenticated) {
      return of(true);
    }

    return this.http
      .get<ApiResponse<AuthSession>>(this.authUrl(AUTH_ENDPOINTS.me), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        tap(() => (this.authenticated = true)),
        map(() => true),
        catchError(() => {
          this.authenticated = false;

          return of(false);
        }),
      );
  }

  private authUrl(endpoint: string): string {
    return `${environment.apiUrl}${endpoint}`;
  }
}
