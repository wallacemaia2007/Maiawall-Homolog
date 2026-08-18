import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { User } from '../../../../../../core/models/user.model';

@Component({
  selector: 'app-welcome-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './welcome-section.component.html',
  styleUrl: './welcome-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeSectionComponent {
  readonly user = input<User | null>(null);

  protected getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Bom dia';
    }

    if (hour < 18) {
      return 'Boa tarde';
    }

    return 'Boa noite';
  }
}
