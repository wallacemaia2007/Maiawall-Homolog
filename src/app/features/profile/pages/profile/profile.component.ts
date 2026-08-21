import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { finalize } from 'rxjs';

import { User, UserProfileUpdatePayload } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { PasswordChangeModalComponent } from '../../components/password-change-modal/password-change-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, PasswordChangeModalComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly user = signal<User | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly saveError = signal('');
  protected readonly passwordModalOpen = signal(false);
  protected readonly passwordModalEmail = signal('');
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    cpf: [''],
    phone: [''],
    birthDate: [''],
    gender: [''],
    profession: [''],
    company: [''],
    address: this.formBuilder.nonNullable.group({
      cep: [''],
      street: [''],
      number: [''],
      complement: [''],
      neighborhood: [''],
      city: [''],
      state: [''],
    }),
  });

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
        next: (user) => {
          this.user.set(user);
          this.fillProfileForm(user);
        },
        error: () => {
          this.user.set(null);
          this.error.set(true);
        },
      });
  }

  protected startEditing(): void {
    const user = this.user();

    if (!user) {
      return;
    }

    this.fillProfileForm(user);
    this.successMessage.set('');
    this.saveError.set('');
    this.editing.set(true);
  }

  protected cancelEditing(): void {
    const user = this.user();

    if (user) {
      this.fillProfileForm(user);
    }

    this.saveError.set('');
    this.editing.set(false);
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set('');
    this.saveError.set('');

    this.userService
      .updateCurrentUser(this.toUpdatePayload())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.fillProfileForm(user);
          this.editing.set(false);
          this.successMessage.set('Informações atualizadas com sucesso.');
        },
        error: () => {
          this.saveError.set('Não foi possível atualizar suas informações agora.');
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

  protected formatCpfCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return value;
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

  protected fieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  private fillProfileForm(user: User): void {
    this.profileForm.reset({
      name: user.name || '',
      email: user.email || '',
      cpf: user.cpf || '',
      phone: user.phone || '',
      birthDate: this.toDateInputValue(user.birthDate),
      gender: user.gender || '',
      profession: user.profession || '',
      company: user.company || '',
      address: {
        cep: user.address?.cep || '',
        street: user.address?.street || '',
        number: user.address?.number || '',
        complement: user.address?.complement || '',
        neighborhood: user.address?.neighborhood || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
      },
    });
  }

  private toUpdatePayload(): UserProfileUpdatePayload {
    const value = this.profileForm.getRawValue();

    return {
      name: value.name.trim(),
      email: value.email.trim(),
      cpf: value.cpf?.trim(),
      phone: value.phone?.trim(),
      birthDate: value.birthDate || '',
      gender: value.gender?.trim(),
      profession: value.profession?.trim(),
      company: value.company?.trim(),
      address: {
        cep: value.address.cep?.trim(),
        street: value.address.street?.trim(),
        number: value.address.number?.trim(),
        complement: value.address.complement?.trim(),
        neighborhood: value.address.neighborhood?.trim(),
        city: value.address.city?.trim(),
        state: value.address.state?.trim(),
      },
    };
  }

  private toDateInputValue(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toISOString().slice(0, 10);
  }
}
