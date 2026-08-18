import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CURRENT_USER_MOCK } from '../mocks/user.mock';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  getCurrentUser(): Observable<User> {
    return of(CURRENT_USER_MOCK.user);
  }
}
