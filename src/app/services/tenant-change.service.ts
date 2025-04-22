import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantChangeService {

  private tenantChangeSubject = new BehaviorSubject<void>(undefined);

  tenantChanged$: Observable<void> = this.tenantChangeSubject.asObservable();
   notifyTenantChanged():void {
    this.tenantChangeSubject.next();
   }
  constructor() { }
}
