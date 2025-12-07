import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { KeysConfiguration } from 'src/app/model/keys-configuration';

@Component({
  selector: 'app-keys-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogContent, MatIconModule],
  templateUrl: './keys-dialog.component.html',
  styleUrl: './keys-dialog.component.scss',
})
export class KeysDialogComponent {
  readonly dialogRef = inject(MatDialogRef<KeysDialogComponent>);
  readonly data = inject<{ keysConfiguration: KeysConfiguration }>(
    MAT_DIALOG_DATA,
  );

  close(): void {
    this.dialogRef.close();
  }

  setKeyRating(key: string, rating: 1 | 2 | 3 | 4 | 5): void {
    this.data.keysConfiguration.keys.find((k) => k.key === key)!.rating =
      rating;
  }
}
