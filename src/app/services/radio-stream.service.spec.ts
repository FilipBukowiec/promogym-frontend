import { TestBed } from '@angular/core/testing';

import { RadioStreamService } from './radio-stream.service';

describe('RadioStreamService', () => {
  let service: RadioStreamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RadioStreamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
