import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// The routes are registered with provideRouter in app.module.ts; this module only makes
// routerLink and router-outlet available to the templates.
@NgModule({
  exports: [RouterModule],
})
export class AppRoutingModule {}
