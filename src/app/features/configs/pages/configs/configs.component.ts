import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';

import { CONTACT_DATA } from '../../../../core/data/contact';
import { UserService } from '../../../../core/services/user.service';

interface ConfigsForm {
  name: string;
  email: string;
  company: string;
  language: 'pt-BR' | 'en-US';
  timezone: string;
  density: 'comfortable' | 'compact';
  emailNotifications: boolean;
  projectUpdates: boolean;
  reviewRequests: boolean;
  weeklySummary: boolean;
  twoFactorEnabled: boolean;
  homologationAlerts: boolean;
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
  private readonly meetingRecipient = CONTACT_DATA.email;

  protected readonly saved = signal(false);
  protected readonly meetingModalOpen = signal(false);
  protected readonly meetingSent = signal(false);
  protected readonly meetingSubject = signal('');
  protected readonly meetingError = signal<string | null>(null);
  protected readonly form = signal<ConfigsForm>({
    name: '',
    email: '',
    company: 'Maiawall Tech',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    density: 'comfortable',
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
  }

  protected updateField<K extends keyof ConfigsForm>(field: K, value: ConfigsForm[K]): void {
    this.saved.set(false);
    this.form.update((form) => ({
      ...form,
      [field]: value,
    }));
  }

  protected saveSettings(): void {
    this.saved.set(true);
  }

  @HostListener('document:keydown.escape')
  protected closeMeetingModalOnEscape(): void {
    this.closeMeetingModal();
  }

  protected openMeetingModal(): void {
    this.meetingError.set(null);
    this.meetingSent.set(false);
    this.meetingModalOpen.set(true);
  }

  protected closeMeetingModal(): void {
    this.meetingModalOpen.set(false);
  }

  protected updateMeetingSubject(subject: string): void {
    this.meetingError.set(null);
    this.meetingSubject.set(subject);
  }

  protected sendMeetingRequest(): void {
    const subject = this.meetingSubject().trim();

    if (!subject) {
      this.meetingError.set('Informe o assunto da reuniao.');
      return;
    }

    const { name, email, company } = this.form();
    const mailSubject = `Solicitacao de reuniao - ${subject}`;
    const body = [
      'O cliente solicitou o agendamento de uma reuniao.',
      '',
      `Assunto: ${subject}`,
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
