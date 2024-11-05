import { TestBed } from '@angular/core/testing';

import { ExpenseGenerationCounterServiceService } from './expense-generation-counter-service.service';

describe('ExpenseGenerationCounterServiceService', () => {
  let service: ExpenseGenerationCounterServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseGenerationCounterServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
