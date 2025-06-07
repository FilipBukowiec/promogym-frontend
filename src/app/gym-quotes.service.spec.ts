import { TestBed } from '@angular/core/testing';

import { GymQuotesService } from './gym-quotes.service';

describe('GymQuotesService', () => {
  let service: GymQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GymQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
