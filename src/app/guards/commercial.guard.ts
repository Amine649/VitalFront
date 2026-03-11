import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class CommercialGuard implements CanActivate {

    constructor(private router: Router) { }

    canActivate(): boolean {
        const isCommercial = localStorage.getItem('isCommercial') === 'true';

        if (!isCommercial) {
            // Not a commercial user, redirect to login
            this.router.navigate(['/login']);
            return false;
        }

        return true;
    }
}
