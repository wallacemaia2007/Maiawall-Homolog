import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../models/api-response.model';
import {
  Project,
  ProjectActivity,
  ProjectChange,
  ProjectCommit,
  ProjectRelease,
  ProjectStatus,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private readonly http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http
      .get<ApiResponse<Project[]>>(this.apiUrl('/projects'), { withCredentials: true })
      .pipe(map(unwrapApiData), map((projects) => projects.map((project) => this.normalizeProject(project))));
  }

  getProjectById(id: string): Observable<Project | null> {
    return this.http
      .get<ApiResponse<Project>>(this.apiUrl(`/projects/${id}`), { withCredentials: true })
      .pipe(map(unwrapApiData), map((project) => this.normalizeProject(project)));
  }

  getProjectHistory(id: string): Observable<ProjectActivity[]> {
    return this.http
      .get<ApiResponse<ProjectActivity[]>>(this.apiUrl(`/projects/${id}/activities`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        map((activities) =>
          activities.map((activity) => ({
            ...activity,
            version: activity.version ?? '',
          })),
        ),
      );
  }

  getProjectCommits(id: string): Observable<ProjectCommit[]> {
    return this.http
      .get<ApiResponse<ProjectCommit[]>>(this.apiUrl(`/projects/${id}/commits`), {
        withCredentials: true,
      })
      .pipe(map(unwrapApiData));
  }

  getProjectReleases(id: string): Observable<ProjectRelease[]> {
    return this.http
      .get<ApiResponse<ProjectRelease[]>>(this.apiUrl(`/projects/${id}/releases`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        map((releases) =>
          releases.map((release) => ({
            ...release,
            changes: this.normalizeReleaseChanges(release.changes),
          })),
        ),
      );
  }

  approveProject(id: string): Observable<Project | null> {
    return this.http
      .post<ApiResponse<Project>>(this.apiUrl(`/projects/${id}/approve`), {}, { withCredentials: true })
      .pipe(map(unwrapApiData), map((project) => this.normalizeProject(project)));
  }

  requestChanges(id: string, message: string): Observable<{ projectId: string; message: string }> {
    return this.http
      .post<ApiResponse<{ projectId: string; message: string }>>(
        this.apiUrl(`/projects/${id}/request-changes`),
        { message },
        { withCredentials: true },
      )
      .pipe(map(unwrapApiData));
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

  private normalizeProject(project: Project): Project {
    return {
      ...project,
      clientName: project.clientName ?? 'Cliente Maiawall',
    };
  }

  private normalizeReleaseChanges(changes: (ProjectChange | string)[] = []): ProjectChange[] {
    return changes.map((change, index) => {
      if (typeof change !== 'string') {
        return change;
      }

      return {
        id: String(index + 1),
        label: change,
        type: 'improvement',
      };
    });
  }

  private apiUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
