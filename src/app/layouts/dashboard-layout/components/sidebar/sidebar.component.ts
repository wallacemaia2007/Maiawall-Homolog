import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarNavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'projects' | 'notifications' | 'pendencias' | 'investments' | 'profile';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly drawerOpen = input(false);
  readonly darkTheme = input(true);
  readonly navItems = input.required<SidebarNavItem[]>();

  readonly toggleCollapsed = output<void>();
  readonly toggleTheme = output<void>();
  readonly logout = output<void>();
}
