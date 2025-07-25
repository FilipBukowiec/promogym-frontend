import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMediaComponent } from './user-media.component';

describe('UserMediaComponent', () => {
  let component: UserMediaComponent;
  let fixture: ComponentFixture<UserMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMediaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
