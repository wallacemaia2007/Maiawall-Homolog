import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly shapeCells = Array.from({ length: 540 }, (_, index) => index);
  private readonly shapeHoverColor = '#26282D';

  protected readonly passwordVisible = signal(false);
  protected readonly loading = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly passwordFieldType = computed(() =>
    this.passwordVisible() ? 'text' : 'password',
  );

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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
        .from('[data-animate="panel"]', { xPercent: -10, opacity: 0 })
        .from('[data-animate="brand"]', { y: 18, opacity: 0 }, '-=0.42')
        .from('[data-animate="headline"]', { y: 26, opacity: 0 }, '-=0.32')
        .from('[data-animate="form-card"]', { x: 34, opacity: 0, scale: 0.98 }, '-=0.58')
        .from('[data-animate="form-field"]', { y: 16, opacity: 0, stagger: 0.07 }, '-=0.28');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => context.revert());
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
    this.animatePasswordToggle();
  }

  protected animateShape(event: MouseEvent): void {
    if (this.reduceMotion) {
      return;
    }

    const target = event.currentTarget as HTMLElement;

    gsap
      .timeline({ defaults: { ease: 'power2.inOut' } })
      .set(target, {
        transformPerspective: 700,
        transformOrigin: 'center center',
      })
      .to(target, {
        rotateX: 90,
        duration: 0.16,
        overwrite: true,
      })
      .set(target, {
        backgroundColor: this.shapeHoverColor,
        rotateX: -90,
      })
      .to(target, {
        rotateX: 0,
        duration: 0.22,
      });
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
    this.authError.set(null);
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.loading.set(false);
        this.authError.set(
          'Nao foi possivel entrar. Verifique suas credenciais e tente novamente.',
        );
      },
    });
  }

  private animatePasswordToggle(): void {
    if (this.reduceMotion) {
      return;
    }

    gsap.fromTo(
      this.host.nativeElement.querySelector('[data-animate="password-toggle"]'),
      { scale: 0.92 },
      { scale: 1, duration: 0.24, ease: 'back.out(2)' },
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
}
