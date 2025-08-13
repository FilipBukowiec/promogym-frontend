import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Sentence } from '../models/sentece.model';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SentencesService {
  private apiUrl = `${environment.apiUrl}sentences`;

  constructor(private http: HttpClient, private auth: AuthService) {}

getAllSentences(): Promise<Sentence[]>{
return this.auth.getAuthHeaders().pipe(
  switchMap((headers) =>{
    return this.http.get<Sentence[]>({headers})
   
  })
   catchError(this.handleError)
)
}

}
