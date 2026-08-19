import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../../../core/models/api-response.model';
import {
  Pending,
  PendingField,
  PendingProject,
  PendingSubmitPayload,
} from '../models/pending.model';

@Injectable({
  providedIn: 'root',
})
export class PendingService {
  constructor(private readonly http: HttpClient) {}

  getPendings(): Observable<Pending[]> {
    return this.http
      .get<ApiResponse<Pending[]>>(this.apiUrl('/pending'), { withCredentials: true })
      .pipe(map(unwrapApiData), map((pendings) => pendings.map((pending) => this.normalizePending(pending))));
  }

  getPendingById(id: string): Observable<Pending> {
    return this.http
      .get<ApiResponse<Pending>>(this.apiUrl(`/pending/${id}`), { withCredentials: true })
      .pipe(map(unwrapApiData), map((pending) => this.normalizePending(pending)));
  }

  submitResponse(id: string, payload: PendingSubmitPayload): Observable<Pending> {
    const hasFiles = Object.values(payload.files).some((files) => files.length > 0);
    const body = hasFiles ? this.toFormData(payload) : { responses: payload.responses };

    return this.http
      .post<ApiResponse<Pending>>(this.apiUrl(`/pending/${id}/responses`), body, {
        withCredentials: true,
      })
      .pipe(map(unwrapApiData), map((pending) => this.normalizePending(pending)));
  }

  markAsRead(id: string): Observable<Pending> {
    return this.http
      .patch<ApiResponse<Pending>>(
        this.apiUrl(`/pending/${id}/read`),
        { read: true },
        { withCredentials: true },
      )
      .pipe(map(unwrapApiData), map((pending) => this.normalizePending(pending)));
  }

  private toFormData(payload: PendingSubmitPayload): FormData {
    const formData = new FormData();
    formData.append('responses', JSON.stringify(payload.responses));

    Object.entries(payload.files).forEach(([fieldId, files]) => {
      files.forEach((file) => formData.append(fieldId, file));
    });

    return formData;
  }

  private normalizePending(pending: Pending): Pending {
    return {
      ...pending,
      project: this.normalizeProject(pending.project, pending.projectId),
      fields: (pending.fields ?? []).map((field) => this.normalizeField(field)),
      responses: pending.responses ?? [],
    };
  }

  private normalizeProject(project?: PendingProject, projectId?: string): PendingProject | undefined {
    if (!project && !projectId) {
      return undefined;
    }

    return {
      id: project?.id ?? projectId ?? '',
      name: project?.name ?? 'Projeto relacionado',
      status: project?.status,
    };
  }

  private normalizeField(field: PendingField): PendingField {
    return {
      ...field,
      type: String(field.type).toUpperCase(),
      required: field.required === true,
      files: field.files ?? [],
    };
  }

  private apiUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
