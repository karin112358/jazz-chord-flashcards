import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LayoutModule } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
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
import { provideRouter } from '@angular/router';
import { ContactComponent } from './components/contact/contact.component';
import { MarkdownModule } from 'ngx-markdown';

const routes = [
  { path: '', component: PlayerComponent },
  { path: 'change-log', component: ChangeLogComponent },
  { path: 'documentation', component: DocumentationComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', component: PlayerComponent },
];

@NgModule({
  declarations: [AppComponent, PlayerComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    MarkdownModule.forRoot(),
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
  ],
  providers: [provideAnimationsAsync(), provideRouter(routes)],
  bootstrap: [AppComponent],
})
export class AppModule {}
