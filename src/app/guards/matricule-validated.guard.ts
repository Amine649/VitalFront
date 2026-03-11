import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class MatriculeValidatedGuard implements CanActivate {

    constructor(private router: Router) { }

    canActivate(): boolean {
        const validatedMatricule = sessionStorage.getItem('validatedMatricule');

        if (!validatedMatricule) {
            // No validated matricule, redirect back to validation page
            this.router.navigate(['/espace-commercial']);
            return false;
        }

        return true;
    }
}
