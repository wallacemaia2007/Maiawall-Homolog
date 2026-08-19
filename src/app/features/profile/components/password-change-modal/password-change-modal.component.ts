import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import gsap from 'gsap';

import { AuthService } from '../../../../core/services/auth.service';
import { ModalTemplateComponent } from '../../../../shared/components/modal-template/modal-template.component';

type ModalStep = 'explanation' | 'success';

@Component({
  selector: 'app-password-change-modal',
  standalone: true,
  imports: [ModalTemplateComponent],
  templateUrl: './password-change-modal.component.html',
  styleUrl: './password-change-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordChangeModalComponent implements AfterViewInit, OnInit, OnDestroy {
  readonly userEmail = input.required<string>();
  readonly isOpen = input.required<boolean>();

  private readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly loading = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected readonly currentStep = signal<ModalStep>('explanation');
  protected readonly countdown = signal(3);
  protected readonly submittedEmail = signal('');

  readonly closedEvent = new EventEmitter<void>();

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.resetState();
        queueMicrotask(() => this.animateEntry());
      }
    });
  }

  ngOnInit(): void {
    this.resetState();
  }

  ngOnDestroy(): void {
    this.resetState();
  }

  private resetState(): void {
    this.currentStep.set('explanation');
    this.loading.set(false);
    this.requestError.set(null);
    this.submittedEmail.set('');
    this.countdown.set(3);
  }

  ngAfterViewInit(): void {
    if (this.reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          duration: 0.4,
          ease: 'power2.out',
        },
      });

      timeline
        .from('[data-animate="modal-content"]', { y: 20, opacity: 0, scale: 0.98 })
        .from('[data-enter="item"]', { y: 12, opacity: 0, stagger: 0.05 }, '-=0.15');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => context.revert());
  }

  private animateEntry(): void {
    if (this.reduceMotion) {
      return;
    }

    queueMicrotask(() => {
      gsap.fromTo(
        this.host.nativeElement.querySelector('[data-animate="modal-content"]'),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
      );
    });
  }

  protected sendRecoveryLink(): void {
    if (this.loading()) {
      return;
    }

    const email = this.userEmail();
    if (!email) {
      this.requestError.set('E-mail nao encontrado.');
      return;
    }

    this.loading.set(true);
    this.requestError.set(null);

    this.auth.requestPasswordRecovery(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submittedEmail.set(email);
        this.currentStep.set('success');
        this.startCountdown();
      },
      error: () => {
        this.loading.set(false);
        this.requestError.set(
          'Nao foi possivel enviar o link agora. Tente novamente.',
        );
      },
    });
  }

  private startCountdown(): void {
    this.countdown.set(3);
    const interval = setInterval(() => {
      this.countdown.update((c) => c - 1);
      if (this.countdown() <= 0) {
        clearInterval(interval);
        this.closeModal();
      }
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  protected closeModal(): void {
    this.closedEvent.emit();
  }

  protected animateSubmitClick(): void {
    if (this.reduceMotion) {
      return;
    }

    gsap.fromTo(
      this.host.nativeElement.querySelector('[data-animate="submit"]'),
      { scale: 0.98 },
      { scale: 1, duration: 0.2, ease: 'back.out(2)' },
    );
  }
}