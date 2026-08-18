import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';

import { CONTACT_DATA } from '../../../../core/data/contact';
import { Project } from '../../../../core/models/project.model';
import { ProjectService } from '../../../../core/services/project.service';
import { ThemeMode, ThemeService } from '../../../../core/services/theme.service';
import { UserService } from '../../../../core/services/user.service';

interface ConfigsForm {
  name: string;
  email: string;
  company: string;
  language: 'pt-BR' | 'en-US';
  timezone: string;
  themeMode: ThemeMode;
  emailNotifications: boolean;
  projectUpdates: boolean;
  reviewRequests: boolean;
  weeklySummary: boolean;
  twoFactorEnabled: boolean;
  homologationAlerts: boolean;
}

interface LanguageOption {
  label: string;
  value: ConfigsForm['language'];
}

@Component({
  selector: 'app-configs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configs.component.html',
  styleUrl: './configs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigsComponent {
  private readonly userService = inject(UserService);
  private readonly projectService = inject(ProjectService);
  private readonly themeService = inject(ThemeService);
  private readonly meetingRecipient = CONTACT_DATA.email;
  private saveFeedbackTimeout?: ReturnType<typeof setTimeout>;

  protected readonly saved = signal(false);
  protected readonly meetingModalOpen = signal(false);
  protected readonly meetingSent = signal(false);
  protected readonly meetingSubject = signal('');
  protected readonly meetingMessage = signal('');
  protected readonly meetingProjectId = signal('');
  protected readonly meetingError = signal<string | null>(null);
  protected readonly languageMenuOpen = signal(false);
  protected readonly projectMenuOpen = signal(false);
  protected readonly projects = signal<Project[]>([]);
  protected readonly languageOptions: LanguageOption[] = [
    {
      label: 'Portugues',
      value: 'pt-BR',
    },
    {
      label: 'English',
      value: 'en-US',
    },
  ];
  protected readonly form = signal<ConfigsForm>({
    name: '',
    email: '',
    company: 'Maiawall Tech',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    themeMode: 'light',
    emailNotifications: true,
    projectUpdates: true,
    reviewRequests: true,
    weeklySummary: false,
    twoFactorEnabled: false,
    homologationAlerts: true,
  });

  protected readonly environmentItems = [
    {
      label: 'Ambiente atual',
      value: 'Homologacao',
    },
    {
      label: 'API configurada',
      value: 'Mock local',
    },
    {
      label: 'Ultima sincronizacao',
      value: 'Hoje as 09:42',
    },
  ];

  constructor() {
    this.userService.getCurrentUser().subscribe((user) => {
      this.form.update((form) => ({
        ...form,
        name: user.name,
        email: user.email,
      }));
    });

    this.projectService.getProjects().subscribe((projects) => {
      this.projects.set(projects);
      this.meetingProjectId.set(projects[0]?.id ?? '');
    });
  }

  protected updateField<K extends keyof ConfigsForm>(field: K, value: ConfigsForm[K]): void {
    this.saved.set(false);
    this.form.update((form) => ({
      ...form,
      [field]: value,
    }));
  }

  protected updateThemeMode(mode: ThemeMode): void {
    this.updateField('themeMode', mode);
    this.themeService.setMode(mode);
  }

  protected toggleThemeMode(): void {
    this.updateThemeMode(this.form().themeMode === 'dark' ? 'light' : 'dark');
  }

  protected saveSettings(): void {
    this.saved.set(true);
    clearTimeout(this.saveFeedbackTimeout);
    this.saveFeedbackTimeout = setTimeout(() => this.saved.set(false), 2600);
  }

  @HostListener('document:keydown.escape')
  protected closeMeetingModalOnEscape(): void {
    this.closeMeetingModal();
    this.languageMenuOpen.set(false);
    this.projectMenuOpen.set(false);
  }

  protected toggleLanguageMenu(): void {
    this.languageMenuOpen.update((open) => !open);
  }

  protected selectLanguage(language: ConfigsForm['language']): void {
    this.updateField('language', language);
    this.languageMenuOpen.set(false);
  }

  protected getSelectedLanguageLabel(): string {
    return (
      this.languageOptions.find((option) => option.value === this.form().language)?.label ??
      'Selecione'
    );
  }

  protected toggleProjectMenu(): void {
    this.projectMenuOpen.update((open) => !open);
  }

  protected selectMeetingProject(projectId: string): void {
    this.meetingError.set(null);
    this.meetingProjectId.set(projectId);
    this.projectMenuOpen.set(false);
  }

  protected getSelectedProjectName(): string {
    return this.projects().find((project) => project.id === this.meetingProjectId())?.name ?? 'Selecione';
  }

  protected openMeetingModal(): void {
    this.meetingError.set(null);
    this.meetingSent.set(false);
    this.projectMenuOpen.set(false);
    this.meetingModalOpen.set(true);
  }

  protected closeMeetingModal(): void {
    this.meetingModalOpen.set(false);
  }

  protected updateMeetingSubject(subject: string): void {
    this.meetingError.set(null);
    this.meetingSubject.set(subject);
  }

  protected updateMeetingMessage(message: string): void {
    this.meetingError.set(null);
    this.meetingMessage.set(message);
  }

  protected sendMeetingRequest(): void {
    const subject = this.meetingSubject().trim();
    const message = this.meetingMessage().trim();
    const projectName = this.getSelectedProjectName();

    if (!subject) {
      this.meetingError.set('Informe o assunto da reuniao.');
      return;
    }

    if (!this.meetingProjectId()) {
      this.meetingError.set('Selecione o projeto da reuniao.');
      return;
    }

    if (!message) {
      this.meetingError.set('Descreva o que voce quer alinhar na reuniao.');
      return;
    }

    const { name, email, company } = this.form();
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
      `Nome: ${name}`,
      `E-mail: ${email}`,
      `Empresa: ${company}`,
      '',
      'Origem: Portal Maiawall Homolog',
    ].join('\n');

    window.location.href = `mailto:${this.meetingRecipient}?subject=${encodeURIComponent(
      mailSubject,
    )}&body=${encodeURIComponent(body)}`;

    this.meetingSent.set(true);
    this.closeMeetingModal();
  }
}
