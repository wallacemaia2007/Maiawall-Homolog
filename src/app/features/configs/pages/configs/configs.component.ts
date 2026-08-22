import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

const BRAND_COLOR_STORAGE_KEY = 'maiawall.brandColor';
const DEFAULT_BRAND_COLOR = '#c8102e';

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
    brandColor: DEFAULT_BRAND_COLOR,
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

  constructor() {
    const storedColor = localStorage.getItem(BRAND_COLOR_STORAGE_KEY);
    const brandColor = this.isValidHexColor(storedColor) ? storedColor : DEFAULT_BRAND_COLOR;
    this.form.update((form) => ({ ...form, brandColor }));
    this.applyBrandColor(brandColor);
  }

  protected updateField<K extends keyof ConfigsForm>(field: K, value: ConfigsForm[K]): void {
    this.feedbackMessage.set('');
    this.form.update((form) => ({
      ...form,
      [field]: value,
    }));

    if (field === 'brandColor' && typeof value === 'string' && this.isValidHexColor(value)) {
      this.applyBrandColor(value);
      localStorage.setItem(BRAND_COLOR_STORAGE_KEY, value);
    }
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

  private applyBrandColor(color: string): void {
    const rgb = this.hexToRgb(color);
    const root = document.documentElement;

    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--color-primary-hover', this.mixWithBlack(color, 0.16));
    root.style.setProperty('--color-primary-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
    root.style.setProperty('--color-primary-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`);
  }

  private isValidHexColor(color: string | null): color is string {
    return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color);
  }

  private hexToRgb(color: string): { r: number; g: number; b: number } {
    const normalizedColor = color.replace('#', '');
    return {
      r: parseInt(normalizedColor.slice(0, 2), 16),
      g: parseInt(normalizedColor.slice(2, 4), 16),
      b: parseInt(normalizedColor.slice(4, 6), 16),
    };
  }

  private mixWithBlack(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const mix = (value: number) => Math.round(value * (1 - amount));
    return `#${[mix(rgb.r), mix(rgb.g), mix(rgb.b)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}
