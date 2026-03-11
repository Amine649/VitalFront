import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaireVetComponent } from './formulaire-vet.component';

describe('FormulaireVetComponent', () => {
  let component: FormulaireVetComponent;
  let fixture: ComponentFixture<FormulaireVetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaireVetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormulaireVetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
