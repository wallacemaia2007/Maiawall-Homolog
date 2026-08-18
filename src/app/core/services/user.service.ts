import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../models/api-response.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/users/me`, {
        withCredentials: true,
      })
      .pipe(map(unwrapApiData));
  }
}
