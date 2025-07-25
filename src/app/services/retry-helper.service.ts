import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, scan, delayWhen } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

  export class RetryHelperService {
    withRetry<T>(obs$: Observable<T>, maxRetries = 3, delayMs = 3000): Observable<T> {
      return obs$.pipe(
        retryWhen(errors =>
          errors.pipe(
            scan((acc, error) => {
              if (acc.retryCount >= maxRetries) {
                acc.shouldThrow = true;
              }
              return {
                error,
                retryCount: acc.retryCount + 1,
                shouldThrow: acc.shouldThrow,
              };
            }, { retryCount: 0, error: null, shouldThrow: false }),
            delayWhen(acc => {
              if (acc.shouldThrow) {
                return throwError(() => acc.error);
              }
              console.warn(`🔁 Retry #${acc.retryCount} za ${delayMs}ms`, acc.error);
              return timer(delayMs);
            })
          )
        )
      );
    }
  }