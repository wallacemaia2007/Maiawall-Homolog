import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { ProjectStatus } from '../../../../core/models/project.model';
import { getProjectStatusView } from '../../../../core/models/project-status.view';
import { ModalTemplateComponent } from '../../../../shared/components/modal-template/modal-template.component';
import {
  Pending,
  PendingField,
  PendingSubmitField,
  canRespondToPending,
  getPendingPriorityLabel,
  getPendingStatusView,
} from '../../models/pending.model';
import { PendingService } from '../../services/pending.service';

type PendingForm = FormGroup<Record<string, FormControl<string | null>>>;

@Component({
  selector: 'app-pending-details-page',
  standalone: true,
  imports: [CommonModule, ModalTemplateComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './pending-details.component.html',
  styleUrl: './pending-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pendingService = inject(PendingService);

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitMessage = signal<string | null>(null);
  protected readonly pending = signal<Pending | null>(null);
  protected readonly selectedFiles = signal<Record<string, File[]>>({});
  protected readonly form = signal<PendingForm>(new FormGroup({}));
  protected readonly confirmationOpen = signal(false);

  protected readonly canRespond = computed(() => {
    const pending = this.pending();
    return pending ? canRespondToPending(pending) : false;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.loading.set(true);
          this.errorMessage.set(null);

          if (!id) {
            this.loading.set(false);
            this.errorMessage.set('Pendencia nao encontrada.');
            return of(null);
          }

          return this.pendingService.getPendingById(id).pipe(
            catchError((error) => {
              this.errorMessage.set(this.toLoadErrorMessage(error?.status));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((pending) => {
        this.pending.set(pending);
        this.selectedFiles.set({});
        this.submitMessage.set(null);

        if (pending) {
          this.form.set(this.createForm(pending.fields));
          this.markAsReadIfNeeded(pending);
        }
      });
  }

  protected reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.pendingService
      .getPendingById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (pending) => {
          this.pending.set(pending);
          this.form.set(this.createForm(pending.fields));
        },
        error: (error) => this.errorMessage.set(this.toLoadErrorMessage(error?.status)),
      });
  }

  protected submit(): void {
    const pending = this.pending();
    const form = this.form();

    if (!pending || !this.canRespond() || this.submitting()) {
      return;
    }

    form.markAllAsTouched();

    if (!this.hasRequiredFiles(pending.fields) || form.invalid) {
      return;
    }

    const hasMultipleInputs = pending.fields.length > 1 || this.hasSelectedFiles();
    if (hasMultipleInputs) {
      this.confirmationOpen.set(true);
      return;
    }

    this.sendResponse(pending);
  }

  protected closeConfirmation(): void {
    if (!this.submitting()) {
      this.confirmationOpen.set(false);
    }
  }

  protected confirmSubmit(): void {
    const pending = this.pending();

    if (!pending || this.submitting()) {
      return;
    }

    this.confirmationOpen.set(false);
    this.sendResponse(pending);
  }

  private sendResponse(pending: Pending): void {
    const form = this.form();
    const responses: PendingSubmitField[] = pending.fields
      .filter((field) => !this.isFileField(field))
      .map((field) => ({
        fieldId: field.id,
        value: form.controls[field.id]?.value ?? null,
      }));

    this.submitting.set(true);
    this.submitMessage.set(null);
    this.errorMessage.set(null);

    this.pendingService
      .submitResponse(pending.id, {
        responses,
        files: this.selectedFiles(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (updatedPending) => {
          this.pending.set(updatedPending);
          this.form.set(this.createForm(updatedPending.fields));
          this.selectedFiles.set({});
          this.submitMessage.set('Resposta enviada');
        },
        error: (error) => this.errorMessage.set(this.toSubmitErrorMessage(error?.status)),
      });
  }

  protected onFilesSelected(field: PendingField, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const selected = field.multiple ? files : files.slice(0, 1);

    this.selectedFiles.update((current) => ({
      ...current,
      [field.id]: selected,
    }));
  }

  protected removeFile(fieldId: string, fileIndex: number): void {
    this.selectedFiles.update((current) => {
      const files = [...(current[fieldId] ?? [])];
      files.splice(fileIndex, 1);
      return {
        ...current,
        [fieldId]: files,
      };
    });
  }

  protected controlFor(field: PendingField): FormControl<string | null> {
    return this.form().controls[field.id] ?? new FormControl<string | null>(null);
  }

  protected isFileField(field: PendingField): boolean {
    return String(field.type).toUpperCase() === 'FILE';
  }

  protected isTextareaField(field: PendingField): boolean {
    return String(field.type).toUpperCase() === 'TEXTAREA';
  }

  protected inputType(field: PendingField): string {
    const type = String(field.type).toUpperCase();

    if (type === 'EMAIL') {
      return 'email';
    }

    if (type === 'NUMBER') {
      return 'number';
    }

    if (type === 'DATE') {
      return 'date';
    }

    return 'text';
  }

  protected selectedFilesFor(fieldId: string): File[] {
    return this.selectedFiles()[fieldId] ?? [];
  }

  protected acceptFor(field: PendingField): string | null {
    const allowed = field.accept ?? field.allowedExtensions ?? [];
    return allowed.length > 0 ? allowed.join(',') : null;
  }

  protected fileHint(field: PendingField): string {
    const allowed = field.allowedExtensions ?? field.accept ?? [];
    const parts = [];

    if (allowed.length > 0) {
      parts.push(allowed.join(', '));
    }

    if (field.maxSizeMb) {
      parts.push(`ate ${field.maxSizeMb} MB`);
    }

    return parts.join(' · ');
  }

  protected fileSize(size = 0): string {
    if (size < 1024 * 1024) {
      return `${Math.max(size / 1024, 0.1).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected requiredCount(fields: PendingField[]): number {
    return fields.filter((field) => field.required).length;
  }

  protected getPriorityLabel(priority?: string): string {
    return getPendingPriorityLabel(priority);
  }

  protected getStatusLabel(pending: Pending): string {
    return getPendingStatusView(pending.status).label;
  }

  protected getStatusTone(pending: Pending): string {
    return getPendingStatusView(pending.status).tone;
  }

  protected getProjectStatusLabel(status?: string): string {
    if (!status) {
      return '';
    }

    return getProjectStatusView(status as ProjectStatus)?.label ?? status;
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return 'Nao informado';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private createForm(fields: PendingField[]): PendingForm {
    const controls: Record<string, FormControl<string | null>> = {};

    fields
      .filter((field) => !this.isFileField(field))
      .forEach((field) => {
        controls[field.id] = new FormControl<string | null>(String(field.value ?? ''), {
          validators: field.required ? [Validators.required] : [],
          nonNullable: false,
        });
      });

    return new FormGroup(controls);
  }

  private hasRequiredFiles(fields: PendingField[]): boolean {
    return fields.every((field) => {
      if (!this.isFileField(field) || !field.required) {
        return true;
      }

      const existingFiles = field.files ?? [];
      const selectedFiles = this.selectedFilesFor(field.id);
      return existingFiles.length > 0 || selectedFiles.length > 0;
    });
  }

  private hasSelectedFiles(): boolean {
    return Object.values(this.selectedFiles()).some((files) => files.length > 0);
  }

  private markAsReadIfNeeded(pending: Pending): void {
    const isRead = pending.isRead ?? pending.read;

    if (isRead === false) {
      this.pendingService.markAsRead(pending.id).subscribe({
        next: (updatedPending) => this.pending.set(updatedPending),
        error: () => undefined,
      });
    }
  }

  private toLoadErrorMessage(status?: number): string {
    if (status === 403) {
      return 'Acesso negado.';
    }

    if (status === 404) {
      return 'Pendencia nao encontrada.';
    }

    if (status === 401) {
      return 'Sessao expirada. Entre novamente para continuar.';
    }

    return 'Nao foi possivel carregar suas pendencias.';
  }

  private toSubmitErrorMessage(status?: number): string {
    if (status === 400 || status === 422) {
      return 'Revise as informacoes enviadas e tente novamente.';
    }

    if (status === 403) {
      return 'Acesso negado.';
    }

    return 'Nao foi possivel enviar sua resposta.';
  }
}
