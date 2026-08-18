import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly loading = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected readonly successModalOpen = signal(false);
  protected readonly submittedEmail = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngAfterViewInit(): void {
    if (this.reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          duration: 0.72,
          ease: 'power3.out',
        },
      });

      timeline
        .from('[data-animate="form-card"]', { x: 34, opacity: 0, scale: 0.98 })
        .from('[data-enter="form-item"]', { y: 16, opacity: 0, stagger: 0.07 }, '-=0.28');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => context.revert());
  }

  protected onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.animateInvalidSubmit();
      return;
    }

    this.animateSubmitClick();
    this.requestError.set(null);
    this.loading.set(true);

    const { email } = this.form.getRawValue();

    this.auth.requestPasswordRecovery(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submittedEmail.set(email);
        this.successModalOpen.set(true);
        this.animateSuccessModal();
      },
      error: () => {
        this.loading.set(false);
        this.requestError.set(
          'Nao foi possivel enviar o link agora. Verifique o e-mail e tente novamente.',
        );
      },
    });
  }

  protected closeSuccessModal(): void {
    this.successModalOpen.set(false);
  }

  protected animateFieldFocus(event: FocusEvent): void {
    if (this.reduceMotion) {
      return;
    }

    gsap.fromTo(
      event.currentTarget as HTMLElement,
      {
        scale: 0.992,
        boxShadow: '0 0 0 0 rgba(76, 58, 227, 0)',
      },
      {
        scale: 1,
        boxShadow: '0 0 0 4px rgba(76, 58, 227, 0.12)',
        duration: 0.28,
        ease: 'power2.out',
        overwrite: true,
      },
    );
  }

  private animateSubmitClick(): void {
    if (this.reduceMotion) {
      return;
    }

    gsap.fromTo(
      this.host.nativeElement.querySelector('[data-animate="submit"]'),
      { scale: 0.985 },
      { scale: 1, duration: 0.26, ease: 'back.out(2)' },
    );
  }

  private animateInvalidSubmit(): void {
    if (this.reduceMotion) {
      return;
    }

    gsap.fromTo(
      this.host.nativeElement.querySelector('[data-animate="form"]'),
      { x: -8 },
      {
        x: 0,
        duration: 0.42,
        ease: 'elastic.out(1, 0.35)',
      },
    );

    gsap.fromTo(
      this.host.nativeElement.querySelectorAll('[aria-invalid="true"]'),
      { boxShadow: '0 0 0 0 rgba(196, 69, 58, 0)' },
      {
        boxShadow: '0 0 0 4px rgba(196, 69, 58, 0.14)',
        duration: 0.28,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      },
    );
  }

  private animateSuccessModal(): void {
    if (this.reduceMotion) {
      return;
    }

    requestAnimationFrame(() => {
      gsap.fromTo(
        this.host.nativeElement.querySelector('[data-animate="success-modal"]'),
        { y: 18, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.34, ease: 'back.out(1.7)' },
      );
    });
  }
}
