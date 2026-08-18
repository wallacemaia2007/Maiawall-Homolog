import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { PROJECT_MOCKS } from '../mocks/project.mock';
import { Project, ProjectStatus } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  getProjects(): Observable<Project[]> {
    return of(PROJECT_MOCKS).pipe(delay(180));
  }

  getPrimaryProject(projects: Project[]): Project | null {
    return projects.find((project) => project.isPrimary) ?? null;
  }

  getMostAdvancedActiveProject(projects: Project[]): Project | null {
    const activeStatuses: ProjectStatus[] = ['DEVELOPMENT', 'HOMOLOGATION', 'CHANGES_REQUESTED'];

    return (
      projects
        .filter((project) => activeStatuses.includes(project.status))
        .sort((first, second) => second.progress - first.progress)[0] ?? null
    );
  }
}
