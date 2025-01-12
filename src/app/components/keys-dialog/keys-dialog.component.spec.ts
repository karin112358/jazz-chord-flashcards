import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeysDialogComponent } from './keys-dialog.component';

describe('KeysDialogComponent', () => {
  let component: KeysDialogComponent;
  let fixture: ComponentFixture<KeysDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeysDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeysDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
