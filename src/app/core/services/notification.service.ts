import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ACTIVITY_MOCKS } from '../mocks/activity.mock';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  getRecentActivity(): Observable<Activity[]> {
    return of(ACTIVITY_MOCKS);
  }
}
