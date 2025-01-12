import { TestBed } from '@angular/core/testing';

import { ToneServiceService } from './tone-service.service';

describe('ToneServiceService', () => {
  let service: ToneServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToneServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
