import { TestBed } from '@angular/core/testing';

import { TenantChangeService } from './tenant-change.service';

describe('TenantChangeService', () => {
  let service: TenantChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantChangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
