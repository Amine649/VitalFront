import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBoutiquesComponent } from './admin-boutiques.component';

describe('AdminBoutiquesComponent', () => {
  let component: AdminBoutiquesComponent;
  let fixture: ComponentFixture<AdminBoutiquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBoutiquesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminBoutiquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
