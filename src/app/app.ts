import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    @if (!isAdminLayout()) {
      <app-header />
    }

    <main class="app-main" [class.app-main--admin]="isAdminLayout()">
      <router-outlet />
    </main>

    @if (!isAdminLayout()) {
      <app-footer />
    }
  `,
  styles: [
    `
      .app-main {
        min-height: 60vh;
      }

      .app-main--admin {
        min-height: 100vh;
      }
    `,
  ],
})
export class App {
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly isAdminLayout = computed(() => this.currentUrl().startsWith('/dashboard'));
}
