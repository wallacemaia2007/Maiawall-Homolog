import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plan-expiration-alert',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-expiration-alert.component.html',
  styleUrl: './plan-expiration-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanExpirationAlertComponent {
  readonly isExpiring = input(false);
  readonly daysUntilExpiration = input<number | null>(null);
  readonly message = input<string | null>(null);
  readonly planName = input<string | null>(null);
  readonly planId = input<string | null>(null);
}