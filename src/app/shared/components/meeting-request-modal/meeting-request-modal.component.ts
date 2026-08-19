import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';

import { CONTACT_DATA } from '../../../core/data/contact';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-meeting-request-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meeting-request-modal.component.html',
  styleUrl: './meeting-request-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingRequestModalComponent implements OnChanges {
  private readonly userService = inject(UserService);
  private readonly meetingRecipient = CONTACT_DATA.email;

  @Input() projects: Project[] = [];
  @Input() selectedProjectId = '';
  @Input() lockProject = false;

  @Output() closed = new EventEmitter<void>();
  @Output() sent = new EventEmitter<void>();

  protected readonly currentUser = signal<User | null>(null);
  protected readonly subject = signal('');
  protected readonly message = signal('');
  protected readonly projectId = signal('');
  protected readonly projectMenuOpen = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.userService.getCurrentUser().subscribe((user) => this.currentUser.set(user));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProjectId'] || changes['projects']) {
      this.projectId.set(this.selectedProjectId || this.projects[0]?.id || '');
      this.projectMenuOpen.set(false);
      this.error.set(null);
    }
  }

  protected close(): void {
    this.closed.emit();
  }

  protected toggleProjectMenu(): void {
    if (this.lockProject) return;
    this.projectMenuOpen.update((open) => !open);
  }

  protected selectProject(projectId: string): void {
    if (this.lockProject) return;
    this.error.set(null);
    this.projectId.set(projectId);
    this.projectMenuOpen.set(false);
  }

  protected getSelectedProjectName(): string {
    return this.projects.find((project) => project.id === this.projectId())?.name ?? 'Selecione';
  }

  protected updateSubject(value: string): void {
    this.error.set(null);
    this.subject.set(value);
  }

  protected updateMessage(value: string): void {
    this.error.set(null);
    this.message.set(value);
  }

  protected sendMeetingRequest(): void {
    const subject = this.subject().trim();
    const message = this.message().trim();
    const projectName = this.getSelectedProjectName();

    if (!this.projectId()) {
      this.error.set('Selecione o projeto da reuniao.');
      return;
    }

    if (!subject) {
      this.error.set('Informe o assunto da reuniao.');
      return;
    }

    if (!message) {
      this.error.set('Descreva o que voce quer alinhar na reuniao.');
      return;
    }

    const user = this.currentUser();
    const mailSubject = `Solicitacao de reuniao - ${subject}`;
    const body = [
      'O cliente solicitou o agendamento de uma reuniao.',
      '',
      `Assunto: ${subject}`,
      `Projeto: ${projectName}`,
      '',
      'Mensagem:',
      message,
      '',
      `Nome: ${user?.name ?? 'Cliente Maiawall'}`,
      `E-mail: ${user?.email ?? 'Nao informado'}`,
      'Origem: Portal Maiawall Homolog',
    ].join('\n');

    window.location.href = `mailto:${this.meetingRecipient}?subject=${encodeURIComponent(
      mailSubject,
    )}&body=${encodeURIComponent(body)}`;

    this.sent.emit();
    this.close();
  }
}
