import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, filter, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { ModalLogoutComponent } from '../../shared/components/modal-logout/modal-logout.component';
import { SidebarComponent, SidebarNavItem } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, SidebarComponent, ModalLogoutComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);

  protected readonly drawerOpen = signal(false);
  protected readonly sidebarCollapsed = signal(true);
  protected readonly logoutModalOpen = signal(false);
  protected readonly darkTheme = this.themeService.darkTheme;
  protected readonly currentUser$ = this.userService.getCurrentUser();
  protected readonly unreadNotifications$ = this.notificationService.unreadCount$;

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
      label: 'Pendencias',
      route: '/pending',
      icon: 'pendencias',
    },
    {
      label: 'Investimentos',
      route: '/investments',
      icon: 'investments',
    },
  ];

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.drawerOpen.set(false));

    this.notificationService
      .getNotifications()
      .pipe(catchError(() => of([])))
      .subscribe();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closeDrawer();
    this.closeLogoutModal();
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

  protected toggleTheme(): void {
    this.themeService.toggleMode();
  }

  protected logout(): void {
    this.logoutModalOpen.set(true);
    this.closeDrawer();
  }

  protected closeLogoutModal(): void {
    this.logoutModalOpen.set(false);
  }

  protected confirmLogout(): void {
    this.closeLogoutModal();
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  protected getPageTitle(): string {
    const url = this.router.url;

    if (url.startsWith('/projects')) {
      return 'Projetos';
    }

    if (url.startsWith('/notifications')) {
      return 'Notificacoes';
    }

    if (url.startsWith('/pending') || url.startsWith('/pendencias')) {
      return 'Pendencias';
    }

    if (url.startsWith('/investments')) {
      return 'Investimentos';
    }

    if (url.startsWith('/profile')) {
      return 'Meu perfil';
    }

    if (url.startsWith('/configs')) {
      return 'Configuracoes';
    }

    if (url.startsWith('/plans')) {
      return 'Planos';
    }

    return 'Dashboard';
  }
}
