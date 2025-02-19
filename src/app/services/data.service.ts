import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dataSubject = new BehaviorSubject<{ [key: string]: boolean }>({});
  data$ = this.dataSubject.asObservable();

  updateData(newData: { [key: string]: boolean }): void {
    const currentData = this.dataSubject.getValue();
    this.dataSubject.next({ ...currentData, ...newData });
  }
}
