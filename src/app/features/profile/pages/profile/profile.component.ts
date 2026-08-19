import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { User } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { PasswordChangeModalComponent } from '../../components/password-change-modal/password-change-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PasswordChangeModalComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly userService = inject(UserService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly user = signal<User | null>(null);
  protected readonly passwordModalOpen = signal(false);
  protected readonly passwordModalEmail = signal('');

  constructor() {
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.loading.set(true);
    this.error.set(false);

    this.userService
      .getCurrentUser()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => this.user.set(user),
        error: () => {
          this.user.set(null);
          this.error.set(true);
        },
      });
  }

  protected openPasswordModal(): void {
    this.passwordModalEmail.set(this.user()?.email || '');
    this.passwordModalOpen.set(true);
  }

  protected closePasswordModal(): void {
    this.passwordModalOpen.set(false);
  }

  protected getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  protected formatCpf(cpf: string): string {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) {
      return cpf;
    }
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  protected formatPhone(phone: string): string {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }

  protected formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  }

  protected hasAddress(user: User): boolean {
    return !!user.address && Object.values(user.address).some((value) => value && value.trim().length > 0);
  }
}