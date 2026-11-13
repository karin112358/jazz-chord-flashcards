import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { LayoutModule } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerComponent } from './components/player/player.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ChangeLogComponent } from './components/change-log/change-log.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { provideRouter, Routes } from '@angular/router';
import { PAGE_SEO } from './services/seo.service';
import { ContactComponent } from './components/contact/contact.component';

// Every route carries its search metadata; `seo: null` marks the fallback for unknown paths (noindex)
const routes: Routes = [
  { path: '', component: PlayerComponent, data: { seo: PAGE_SEO.home } },
  { path: 'change-log', component: ChangeLogComponent, data: { seo: PAGE_SEO.changeLog } },
  { path: 'documentation', component: DocumentationComponent, data: { seo: PAGE_SEO.documentation } },
  { path: 'contact', component: ContactComponent, data: { seo: PAGE_SEO.contact } },
  { path: '**', component: PlayerComponent, data: { seo: null } },
];

@NgModule({
  declarations: [AppComponent, PlayerComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
  ],
  providers: [provideAnimationsAsync(), provideRouter(routes), provideClientHydration(withEventReplay())],
  bootstrap: [AppComponent],
})
export class AppModule {}
