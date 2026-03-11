import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  // First check localStorage for quick validation (cached authentication)
  const isAdmin = localStorage.getItem('isAdmin');
  const userId = localStorage.getItem('userId');

  if (isAdmin || userId) {
    // User has logged in, allow access
    return true;
  }

  // If no localStorage, verify cookie session with backend
  // This handles the case where cookies exist but localStorage was cleared
  return http.get(`${environment.apiUrl}/veterinaires/me`, {
    withCredentials: true
  }).pipe(
    map((userData: any) => {
      // Valid session - store user data in localStorage for future quick checks
      if (userData && (userData.id || userData.userId)) {
        const id = userData.id || userData.userId;
        localStorage.setItem('userId', id.toString());
        localStorage.setItem('isAdmin', 'false');

        if (userData.nom || userData.prenom) {
          const fullName = `${userData.prenom || ''} ${userData.nom || ''}`.trim();
          localStorage.setItem('userFullName', fullName);
        }

        return true;
      }

      // No valid user data, redirect to login
      router.navigate(['/login']);
      return false;
    }),
    catchError((error) => {
      // API call failed (401, 403, etc.) - no valid session
      router.navigate(['/login']);
      return of(false);
    })
  );
};
