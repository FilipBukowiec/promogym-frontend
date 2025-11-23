import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Story } from '../models/story.model';

declare const FB: any;


@Injectable({
  providedIn: 'root'
})
export class FacebookService {
  private apiUrl = 'http://localhost:3000/facebook/stories';

  constructor(private httpClient: HttpClient) { }




  waitForFBInit(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof FB !== 'undefined') { resolve(); } else {
        const interval = setInterval(() => { if (typeof FB !== 'undefined') { clearInterval(interval); resolve(); } }, 100);
      }
    })
  }



  async login(): Promise<string> {
    await this.waitForFBInit();
    return new Promise((resolve, reject) => {
      FB.login((response: any) => {
        if (response.authResponse) {
          resolve(response.authResponse.accessToken);
        }
        else {
          reject("Facebook login failed");
        }
      },
        {
          scope: 'pages_show_list,pages_read_engagement,pages_read_user_content'
        })
    })
  }

  getStories(userToken: string, pageId: string): Observable<Story[]> {
    return this.httpClient.post<Story[]>(this.apiUrl, { userToken, pageId })
  }
}
