import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashClosingComponent } from './cash-closing.component';

describe('CashClosingComponent', () => {
  let component: CashClosingComponent;
  let fixture: ComponentFixture<CashClosingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashClosingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashClosingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
