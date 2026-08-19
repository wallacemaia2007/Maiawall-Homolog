import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';

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
  private readonly themeService = inject(ThemeService);
  private saveFeedbackTimeout?: ReturnType<typeof setTimeout>;

  protected readonly saved = signal(false);
  protected readonly languageMenuOpen = signal(false);
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
      value: 'Backend Node/Mongo',
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
  protected closeMenusOnEscape(): void {
    this.languageMenuOpen.set(false);
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

}
