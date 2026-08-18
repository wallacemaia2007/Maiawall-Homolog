import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  PROJECT_ACTIVITY_MOCKS,
  PROJECT_COMMIT_MOCKS,
  PROJECT_MOCKS,
  PROJECT_RELEASE_MOCKS,
} from '../mocks/project.mock';
import {
  Project,
  ProjectActivity,
  ProjectCommit,
  ProjectRelease,
  ProjectStatus,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  getProjects(): Observable<Project[]> {
    return of(PROJECT_MOCKS).pipe(delay(180));
  }

  getProjectById(id: string): Observable<Project | null> {
    return of(PROJECT_MOCKS.find((project) => project.id === id) ?? null).pipe(delay(180));
  }

  getProjectHistory(id: string): Observable<ProjectActivity[]> {
    return of(PROJECT_ACTIVITY_MOCKS.filter((activity) => activity.projectId === id)).pipe(
      delay(160),
    );
  }

  getProjectCommits(id: string): Observable<ProjectCommit[]> {
    return of(PROJECT_COMMIT_MOCKS[id] ?? []).pipe(delay(160));
  }

  getProjectReleases(id: string): Observable<ProjectRelease[]> {
    return of(PROJECT_RELEASE_MOCKS[id] ?? []).pipe(delay(160));
  }

  approveProject(id: string): Observable<Project | null> {
    const project = PROJECT_MOCKS.find((item) => item.id === id);
    const approvedProject: Project | null = project
      ? { ...project, status: 'APPROVED', progress: 100 }
      : null;

    return of(approvedProject).pipe(delay(240));
  }

  requestChanges(id: string, message: string): Observable<{ projectId: string; message: string }> {
    return of({ projectId: id, message }).pipe(delay(240));
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
