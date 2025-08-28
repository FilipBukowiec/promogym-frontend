import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAdvertisementsComponent } from './user-advertisements.component';

describe('UserAdvertisementsComponent', () => {
  let component: UserAdvertisementsComponent;
  let fixture: ComponentFixture<UserAdvertisementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAdvertisementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAdvertisementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
