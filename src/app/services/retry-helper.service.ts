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
            scan((retryCount, error) => {
              if (retryCount >= maxRetries) {
                throw error;
              }
              console.warn(`🔁 Retry #${retryCount + 1} za ${delayMs}ms`, error);
              return retryCount + 1;
            }, 0),
            delayWhen(() => timer(delayMs))
          )
        )
      );
    }
  }