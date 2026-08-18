import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { CONTACT_DATA } from '../../../../core/data/contact';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly supportEmail = CONTACT_DATA.email;

  ngAfterViewInit(): void {
    if (this.reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { duration: 0.6, ease: 'power3.out' } })
        .from('[data-animate="brand"]', { y: -12, opacity: 0 })
        .from('[data-animate="code"]', { y: 18, opacity: 0 }, '-=0.34')
        .from('[data-animate="message"]', { y: 14, opacity: 0 }, '-=0.36')
        .from('[data-animate="cta"]', { y: 10, opacity: 0 }, '-=0.32');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => context.revert());
  }

  sendMessage(): string {
    const subject = encodeURIComponent('Erro 404 - Pagina nao encontrada');
    const body = encodeURIComponent(
      'Ola, encontrei um erro 404 no site da Maiawall. Poderiam me ajudar?',
    );

    return `mailto:${this.supportEmail}?subject=${subject}&body=${body}`;
  }
}
