import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/services/auth.service';
import { Sentence } from '../models/sentence.model';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { RetryHelperService } from './retry-helper.service';

@Injectable({
  providedIn: 'root',
})
export class SentencesService {
  private apiUrl = `${environment.apiUrl}sentences`;

  public sentencesSubject = new BehaviorSubject<Sentence[]>([]);
  sentences$ = this.sentencesSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService, private retryHelper: RetryHelperService) {}

  public getAllSentences(): Observable<Sentence[]> {
    return this.retryHelper.withRetry(
      this.http.get<Sentence[]>(this.apiUrl).pipe(
        tap((sentences) => this.sentencesSubject.next(sentences)),
        catchError(() => of([]))
      )
    );
  }

  public getSentenceOfTheDay(): Observable<Sentence> {
    return this.retryHelper.withRetry(this.http.get<Sentence>(`${this.apiUrl}/daily`).pipe(catchError(() => of({} as Sentence))));
  }

  public moveUp(id: string): Observable<Sentence[]> {
    return this.http.put<Sentence[]>(`${this.apiUrl}/${id}/move-up`, {}).pipe(
      switchMap(() => this.getAllSentences()),
      catchError(() => of([]))
    );
  }

  public moveDown(id: string): Observable<Sentence[]> {
    return this.http.put<Sentence[]>(`${this.apiUrl}/${id}/move-down`, {}).pipe(
      switchMap(() => this.getAllSentences()),
      catchError(() => of([]))
    );
  }

  public addNewSentence(content: string): Observable<Sentence[]> {
    return this.http.post<Sentence>(`${this.apiUrl}/single`, { content }).pipe(switchMap(() => this.getAllSentences()));
  }

  public addNewSentences(sentences: { content: string }[]) {
    return this.http.post<Sentence[]>(`${this.apiUrl}/bulk`, sentences).pipe(switchMap(() => this.getAllSentences()));
  }

  public deleteAllSentences(): Observable<Sentence[]> {
    return this.http.delete<Sentence[]>(`${this.apiUrl}/bulk`).pipe(switchMap(() => this.getAllSentences()));
  }

  public deleteSentence(id: string): Observable<Sentence[]> {
    return this.http.delete<Sentence>(`${this.apiUrl}/${id}`).pipe(switchMap(() => this.getAllSentences()));
  }

  public updateSentence(id: string, content: string): Observable<Sentence> {
    return this.http.put<Sentence>(`${this.apiUrl}/${id}`, { content }).pipe(catchError((eror) => of({} as Sentence)));
  }
}
