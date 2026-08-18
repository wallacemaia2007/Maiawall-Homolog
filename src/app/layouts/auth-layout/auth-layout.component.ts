import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly shapeHoverColor = '#26282D';

  protected readonly shapeCells = Array.from({ length: 540 }, (_, index) => index);

  ngAfterViewInit(): void {
    if (this.reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap
        .timeline({
          defaults: {
            duration: 0.72,
            ease: 'power3.out',
          },
        })
        .from('[data-animate="panel"]', { xPercent: -10, opacity: 0 })
        .from('[data-animate="brand"]', { y: 18, opacity: 0 }, '-=0.42')
        .from('[data-animate="headline"]', { y: 26, opacity: 0 }, '-=0.32');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => context.revert());
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
}
