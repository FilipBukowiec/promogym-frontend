import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FacebookPage, FacebookStory } from '../models/facebook.model';
import { environment } from '../../environments/environment';

declare const FB: any;

@Injectable({
  providedIn: 'root',
})
export class FacebookService {
  private apiUrl = `${environment.apiUrl}facebook`;

  constructor(private httpClient: HttpClient) { }

  waitForFBInit(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof FB !== 'undefined') {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (typeof FB !== 'undefined') {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }

  async login(): Promise<string> {
    await this.waitForFBInit();
    return new Promise((resolve, reject) => {
      FB.login(
        (response: any) => {
          if (response.authResponse) {
            resolve(response.authResponse.accessToken);
          } else {
            reject('Facebook login failed');
          }
        },
        {
          scope: 'pages_show_list,pages_read_engagement,pages_read_user_content,business_management',
        }
      );
    });
  }

  getPages(userToken: string): Observable<FacebookPage[]> {
    const body = { userToken: userToken };
    return this.httpClient.post<FacebookPage[]>(`${this.apiUrl}/pages`, body);
  }

  getStories(pageToken: string, pageId: string, includeSharedStories: boolean = false): Observable<FacebookStory[]> {
    const body = { pageToken, pageId, includeSharedStories };
    return this.httpClient.post<FacebookStory[]>(`${this.apiUrl}/stories`, body);
  }


  getRandomStory(pageToken: string, pageId: string, includeSharedStories: boolean = false): Observable<FacebookStory> {
    const body = { pageToken, pageId, includeSharedStories };
    return this.httpClient.post<FacebookStory>(`${this.apiUrl}/stories/random`, body)
  }
}
