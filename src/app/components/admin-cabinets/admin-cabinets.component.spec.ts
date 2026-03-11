import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCabinetsComponent } from './admin-cabinets.component';

describe('AdminCabinetsComponent', () => {
    let component: AdminCabinetsComponent;
    let fixture: ComponentFixture<AdminCabinetsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminCabinetsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminCabinetsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
