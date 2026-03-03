import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50 font-sans antialiased">
      <app-sidebar />
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <app-topbar />
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AppComponent { }
