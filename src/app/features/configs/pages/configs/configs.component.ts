import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface ConfigsForm {
  companyName: string;
  cnpj: string;
  phone: string;
  commercialEmail: string;
  address: string;
  logoUrl: string;
  brandColor: string;
  notifyNewProjects: boolean;
  notifyReleases: boolean;
  notifyPendingItems: boolean;
  notifyInstallments: boolean;
  notifyPasswordRecovery: boolean;
  notifyMeetings: boolean;
  availableStartTime: string;
  availableEndTime: string;
  meetingReminder: string;
}

interface NotificationSetting {
  field: keyof Pick<
    ConfigsForm,
    | 'notifyNewProjects'
    | 'notifyReleases'
    | 'notifyPendingItems'
    | 'notifyInstallments'
    | 'notifyPasswordRecovery'
    | 'notifyMeetings'
  >;
  title: string;
  description: string;
}

interface ExportAction {
  title: string;
  description: string;
  action: string;
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
  private feedbackTimeout?: ReturnType<typeof setTimeout>;

  protected readonly feedbackMessage = signal('');
  protected readonly form = signal<ConfigsForm>({
    companyName: 'Maiawall Tech',
    cnpj: '',
    phone: '',
    commercialEmail: '',
    address: '',
    logoUrl: '',
    brandColor: '#4c3ae3',
    notifyNewProjects: true,
    notifyReleases: true,
    notifyPendingItems: true,
    notifyInstallments: true,
    notifyPasswordRecovery: true,
    notifyMeetings: true,
    availableStartTime: '09:00',
    availableEndTime: '18:00',
    meetingReminder: '60',
  });

  protected readonly notificationSettings: NotificationSetting[] = [
    {
      field: 'notifyNewProjects',
      title: 'Novos projetos',
      description: 'Avisar quando um novo projeto entrar no portal.',
    },
    {
      field: 'notifyReleases',
      title: 'Commits e releases',
      description: 'Receber atualizacoes de entregas, versoes e publicacoes.',
    },
    {
      field: 'notifyPendingItems',
      title: 'Pendencias',
      description: 'Sinalizar itens aguardando aprovacao ou resposta.',
    },
    {
      field: 'notifyInstallments',
      title: 'Vencimentos de parcelas',
      description: 'Lembrar sobre parcelas proximas do vencimento.',
    },
    {
      field: 'notifyPasswordRecovery',
      title: 'Recuperacao de senha',
      description: 'Receber avisos de solicitacoes de acesso.',
    },
    {
      field: 'notifyMeetings',
      title: 'Reunioes agendadas',
      description: 'Confirmacoes e lembretes de horarios marcados.',
    },
  ];

  protected readonly exportActions: ExportAction[] = [
    {
      title: 'Clientes e contatos',
      description: 'Exportar dados cadastrais vinculados a conta.',
      action: 'clientes',
    },
    {
      title: 'Projetos e planos',
      description: 'Baixar um pacote com projetos ativos, planos e historico.',
      action: 'projetos',
    },
    {
      title: 'Relatorio financeiro',
      description: 'Gerar resumo de parcelas, valores pagos e pendencias.',
      action: 'financeiro',
    },
    {
      title: 'Backup manual',
      description: 'Solicitar um backup completo dos dados do portal.',
      action: 'backup',
    },
  ];

  protected updateField<K extends keyof ConfigsForm>(field: K, value: ConfigsForm[K]): void {
    this.feedbackMessage.set('');
    this.form.update((form) => ({
      ...form,
      [field]: value,
    }));
  }

  protected saveSettings(): void {
    this.showFeedback('Configuracoes salvas localmente.');
  }

  protected requestExport(action: string): void {
    const selectedAction = this.exportActions.find((item) => item.action === action);
    this.showFeedback(`${selectedAction?.title ?? 'Exportacao'} preparada para integracao.`);
  }

  private showFeedback(message: string): void {
    this.feedbackMessage.set(message);
    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => this.feedbackMessage.set(''), 2600);
  }
}
