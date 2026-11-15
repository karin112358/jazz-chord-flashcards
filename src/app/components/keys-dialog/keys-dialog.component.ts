import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { KeyRatings, Rating } from 'src/app/chord-engine';

@Component({
  selector: 'app-keys-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogContent, MatIconModule],
  templateUrl: './keys-dialog.component.html',
  styleUrl: './keys-dialog.component.scss',
})
export class KeysDialogComponent {
  readonly dialogRef = inject(MatDialogRef<KeysDialogComponent>);
  readonly data = inject<{ keysConfiguration: KeyRatings }>(
    MAT_DIALOG_DATA,
  );

  readonly stars = [1, 2, 3, 4, 5] as const;

  close(): void {
    this.dialogRef.close();
  }

  setKeyRating(key: string, rating: Rating): void {
    this.data.keysConfiguration.keys.find((k) => k.key === key)!.rating =
      rating;
  }
}
