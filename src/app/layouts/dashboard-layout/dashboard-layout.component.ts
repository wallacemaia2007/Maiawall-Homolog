import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { UserService } from '../../core/services/user.service';
import { SidebarComponent, SidebarNavItem } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected readonly drawerOpen = signal(false);
  protected readonly sidebarCollapsed = signal(true);
  protected readonly currentUser$ = this.userService.getCurrentUser();

  protected readonly navItems: SidebarNavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Projetos',
      route: '/projects',
      icon: 'projects',
    },
    {
      label: 'Notificacoes',
      route: '/notifications',
      icon: 'notifications',
    },
    {
      label: 'Meu perfil',
      route: '/profile',
      icon: 'profile',
    },
  ];

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.drawerOpen.set(false));
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closeDrawer();
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected logout(): void {
    this.router.navigateByUrl('/login');
  }

  protected getPageTitle(): string {
    const url = this.router.url;

    if (url.startsWith('/projects')) {
      return 'Projetos';
    }

    if (url.startsWith('/notifications')) {
      return 'Notificacoes';
    }

    if (url.startsWith('/profile')) {
      return 'Meu perfil';
    }

    if (url.startsWith('/configs')) {
      return 'Configuracoes';
    }

    return 'Dashboard';
  }
}
