import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, filter, finalize, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { Notification } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { PlanQuoteCartService } from '../../features/plans/services/plan-quote-cart.service';
import { QuoteCartDrawerComponent } from '../../features/plans/components/quote-cart-drawer/quote-cart-drawer.component';
import { ModalLogoutComponent } from '../../shared/components/modal-logout/modal-logout.component';
import { SidebarComponent, SidebarNavItem } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, SidebarComponent, ModalLogoutComponent, QuoteCartDrawerComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  @ViewChild('notificationsMenu')
  private readonly notificationsMenu?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);
  protected readonly quoteCart = inject(PlanQuoteCartService);

  protected readonly drawerOpen = signal(false);
  protected readonly sidebarCollapsed = signal(true);
  protected readonly logoutModalOpen = signal(false);
  protected readonly darkTheme = this.themeService.darkTheme;
  protected readonly currentUser$ = this.userService.getCurrentUser();
  protected readonly unreadNotifications$ = this.notificationService.unreadCount$;
  protected readonly headerNotifications$ = this.notificationService.notifications$.pipe(
    map((notifications) => notifications.slice(0, 6)),
  );
  protected readonly notificationsMenuOpen = signal(false);
  protected readonly markingReadNotificationId = signal<string | null>(null);

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
    {
      label: 'Planos',
      route: '/plans',
      icon: 'plans',
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
    this.closeNotificationsMenu();
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    if (this.notificationsMenu?.nativeElement.contains(event.target as Node)) {
      return;
    }

    this.closeNotificationsMenu();
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected openQuoteCart(): void {
    this.closeNotificationsMenu();
    this.quoteCart.open();
  }

  protected toggleNotificationsMenu(event: Event): void {
    event.stopPropagation();
    this.notificationsMenuOpen.update((open) => !open);
  }

  protected closeNotificationsMenu(): void {
    this.notificationsMenuOpen.set(false);
  }

  protected openNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    const markAsRead$ = notification.read ? of(notification) : this.notificationService.markAsRead(notification.id);

    markAsRead$
      .pipe(
        switchMap((updatedNotification) =>
          this.notificationService.resolveDestination(updatedNotification),
        ),
        catchError(() => of(null)),
      )
      .subscribe((destination) => {
        this.closeNotificationsMenu();

        if (destination) {
          this.router.navigate(destination);
        }
      });
  }

  protected markNotificationAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (notification.read || this.markingReadNotificationId() === notification.id) {
      return;
    }

    this.markingReadNotificationId.set(notification.id);

    this.notificationService
      .markAsRead(notification.id)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.markingReadNotificationId.set(null)),
      )
      .subscribe();
  }

  protected hasNotificationAction(notification: Notification): boolean {
    return Boolean(this.notificationService.getDestination(notification));
  }

  protected notificationActionLabel(notification: Notification): string {
    return this.notificationService.getVisual(notification).actionLabel;
  }

  protected notificationSummary(notification: Notification): string {
    return this.notificationService.getVisual(notification).label;
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
