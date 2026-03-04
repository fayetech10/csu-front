import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, NgIf],
  template: `
    <div class="font-sans antialiased text-gray-900">
      <div *ngIf="authService.isLoggedIn(); else loginLayout" class="flex h-screen overflow-hidden bg-gray-100">
        <app-sidebar />
        <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
          <app-topbar />
          <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
            <router-outlet />
          </main>
        </div>
      </div>
      
      <ng-template #loginLayout>
        <router-outlet />
      </ng-template>
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
}
