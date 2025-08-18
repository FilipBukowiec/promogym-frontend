import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Sentence } from '../models/sentence.model';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { RetryHelperService } from './retry-helper.service';

@Injectable({
  providedIn: 'root',
})
export class SentencesService {
  private apiUrl = `${environment.apiUrl}sentences`;

  private sentencesSubject = new BehaviorSubject<Sentence[]>([]);
  sentences$ = this.sentencesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private retryHelper: RetryHelperService
  ) {}

  getAllSentences(): Observable<Sentence[]> {
    return this.retryHelper.withRetry(
      this.auth.getAuthHeaders().pipe(
        switchMap((headers) =>
          this.http.get<Sentence[]>(this.apiUrl, { headers })
        ),
        tap((sentences) => this.sentencesSubject.next(sentences)),
        catchError((error) => {
          console.error('Błąd pobierania sentencji', error);
          return of([]);
        })
      )
    );
  }

  getSentenceOfTheDay(): Observable<Sentence> {
    return this.retryHelper.withRetry(
      this.auth.getAuthHeaders().pipe(
        switchMap((headers) =>
          this.http.get<Sentence>(`${this.apiUrl}/daily`, { headers })
        ),
        catchError((error) => {
          console.error('Błąd pobierania sentencji', error);
          return of({} as Sentence);
        })
      )
    );
  }

  moveUp(id: string): Observable<Sentence[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<Sentence[]>(
          `${this.apiUrl}/${id}/move-up`,
          {},
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Nie możne przesunąc w górę', error);
        return of([]);
      })
    );
  }

  moveDown(id: string): Observable<Sentence[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<Sentence[]>(
          `${this.apiUrl}/${id}/move-down`,
          {},
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Nie możne przesunąc w górę', error);
        return of([]);
      })
    );
  }

  addNewSentence(content: string): Observable<Sentence[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http
          .post<Sentence>(`${this.apiUrl}/single`, { content }, { headers })
          .pipe(
            switchMap(() => this.getAllSentences()) // odśwież BehaviorSubject
          )
      )
    );
  }

  deleteAllSentences(): Observable<Sentence[]> {
    return this.auth
      .getAuthHeaders()
      .pipe(
        switchMap((headers) =>
          this.http
            .delete<Sentence[]>(`${this.apiUrl}/bulk`, { headers })
            .pipe(switchMap(() => this.getAllSentences()))
        )
      );
  }
}
