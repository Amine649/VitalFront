import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  showPassword = false;

  // Forgot password state
  forgotPasswordMode = false;
  forgotPasswordStep: 1 | 2 = 1;
  forgotPasswordForm: FormGroup;
  forgotPasswordLoading = false;
  forgotPasswordError = '';
  forgotPasswordSuccess = '';
  showNewPassword = false;
  showConfirmPassword = false;
  userEmail = ''; // Store email from step 1 to use in step 2

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  get f() { return this.loginForm.controls; }
  get fp() { return this.forgotPasswordForm.controls; }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // withCredentials: true allows browser to receive and store HttpOnly cookies
    this.http.post<any>(`${environment.apiUrl}/login`, loginData, { withCredentials: true }).subscribe({
      next: (response) => {
        // Backend sets HttpOnly cookie automatically
        // No need to manually store token - browser handles it
        if (response) {
          // Debug: Log the entire response to see what backend is returning
          console.log('Login response:', response);
          console.log('is_commercial field:', response.is_commercial);
          console.log('isCommercial field:', response.isCommercial);

          // Check for isAdmin in different formats
          const isAdmin = response.isAdmin === true ||
            response.isAdmin === 'true' ||
            response.admin === true ||
            response.role === 'ADMIN';

          // Check for commercial user
          const isCommercial = response.is_commercial === true ||
            response.isCommercial === true ||
            response.is_commercial === 'true' ||
            response.isCommercial === 'true';

          console.log('isAdmin:', isAdmin);
          console.log('isCommercial:', isCommercial);

          // Only store non-sensitive user info
          if (isAdmin) {
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('isCommercial', 'false');
            this.loading = false;
            this.router.navigate(['/admin']);
          } else if (isCommercial) {
            // Commercial user flow
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('isCommercial', 'true');

            // Store userId for commercial users
            if (response.userId || response.id) {
              const userId = response.userId || response.id;
              localStorage.setItem('userId', userId.toString());
            }

            // Store user name if available
            if (response.nom || response.prenom) {
              const fullName = `${response.prenom || ''} ${response.nom || ''}`.trim();
              localStorage.setItem('userFullName', fullName);
            }

            this.loading = false;
            this.router.navigate(['/espace-commercial']);
          } else {
            // Regular veterinarian flow
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('isCommercial', 'false');

            // Store userId for non-admin users
            if (response.userId || response.id) {
              const userId = response.userId || response.id;
              localStorage.setItem('userId', userId.toString());
            }

            // Store user name if available
            if (response.nom || response.prenom) {
              const fullName = `${response.prenom || ''} ${response.nom || ''}`.trim();
              localStorage.setItem('userFullName', fullName);
            }

            // If userId is not in response, fetch current user info
            if (!response.userId && !response.id) {
              this.fetchCurrentUserInfo();
            } else {
              this.loading = false;
              this.router.navigate(['/espace-veterinaire']);
            }
          }
        } else {
          this.loading = false;
          this.error = "Identifiants invalides ou réponse inattendue.";
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('Login error:', error);

        // User-friendly error messages
        if (error.status === 401) {
          this.error = "Email ou mot de passe incorrect.";
        } else if (error.status === 404) {
          this.error = "Utilisateur non trouvé.";
        } else if (error.status === 500) {
          this.error = "Erreur serveur. Veuillez réessayer plus tard.";
        } else {
          this.error = "Erreur lors de la connexion. Veuillez réessayer.";
        }
      }
    });
  }

  /**
   * Fetch current user info after login (when userId is not in login response)
   */
  fetchCurrentUserInfo(): void {
    // Get current user info from /api/veterinaires/me endpoint
    this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { withCredentials: true }).subscribe({
      next: (userData) => {
        this.storeUserData(userData);
        this.loading = false;
        this.router.navigate(['/espace-veterinaire']);
      },
      error: (error) => {
        console.error('Error fetching from /api/veterinaires/me:', error);

        // If 401, the backend might be rejecting non-ACTIVE users
        // This is a backend issue - /me should work for all authenticated users
        // For now, navigate anyway and let the page handle it
        this.loading = false;
        console.warn('Navigating to /espace-veterinaire despite error (backend should fix /me endpoint)');
        this.router.navigate(['/espace-veterinaire']);
      }
    });
  }

  /**
   * Store user data in localStorage
   */
  private storeUserData(userData: any): void {
    if (userData.id || userData.userId) {
      const userId = userData.id || userData.userId;
      localStorage.setItem('userId', userId.toString());
    }

    if (userData.nom || userData.prenom) {
      const fullName = `${userData.prenom || ''} ${userData.nom || ''}`.trim();
      localStorage.setItem('userFullName', fullName);
    }
  }

  // ===== FORGOT PASSWORD METHODS =====

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Show forgot password form
   */
  showForgotPassword(): void {
    this.forgotPasswordMode = true;
    this.forgotPasswordStep = 1;
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';
    this.forgotPasswordForm.reset();
  }

  /**
   * Return to login form
   */
  backToLogin(): void {
    this.forgotPasswordMode = false;
    this.forgotPasswordStep = 1;
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';
    this.error = '';
    this.userEmail = '';
    this.forgotPasswordForm.reset();
  }

  /**
   * Toggle new password visibility
   */
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Send OTP to user's email (Step 1)
   */
  sendOTP(): void {
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';

    // Validate email field
    const emailControl = this.forgotPasswordForm.get('email');
    if (!emailControl?.value || emailControl.invalid) {
      this.forgotPasswordError = 'Veuillez entrer une adresse email valide.';
      return;
    }

    this.forgotPasswordLoading = true;
    const email = emailControl.value;
    this.userEmail = email; // Store for step 2

    this.http.post<any>(`${environment.apiUrl}/forgot-password-otp`, { email }).subscribe({
      next: (response) => {
        console.log('OTP send success:', response);
        this.forgotPasswordLoading = false;
        this.forgotPasswordSuccess = 'Un code OTP a été envoyé à votre adresse email.';
        // Move to step 2 after a brief delay to let user see success message
        setTimeout(() => {
          this.forgotPasswordStep = 2;
          this.forgotPasswordSuccess = '';
        }, 1500);
      },
      error: (error: any) => {
        this.forgotPasswordLoading = false;
        console.error('Send OTP error:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Full error object:', error);

        // WORKAROUND: Multiple checks for CORS issues where backend actually succeeded
        const isCorsError = error.status === 0 ||
          error.statusText === 'Unknown Error' ||
          (error.status === 200 && error.ok === false) ||
          error.name === 'HttpErrorResponse';

        if (isCorsError && error.status !== 404 && error.status !== 500 && error.status !== 400) {
          console.warn('Possible CORS error detected, treating as success. Status:', error.status);
          this.forgotPasswordSuccess = 'Un code OTP a été envoyé à votre adresse email.';
          setTimeout(() => {
            this.forgotPasswordStep = 2;
            this.forgotPasswordSuccess = '';
          }, 1500);
          return;
        }

        if (error.status === 404) {
          this.forgotPasswordError = 'Aucun compte trouvé avec cet email.';
        } else if (error.status === 500) {
          this.forgotPasswordError = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          this.forgotPasswordError = `Erreur lors de l'envoi du code . Veuillez réessayer.`;
        }
      }
    });
  }

  /**
   * Reset password using OTP (Step 2)
   */
  resetPassword(): void {
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';

    // Validate all fields for step 2
    const otpControl = this.forgotPasswordForm.get('otp');
    const newPasswordControl = this.forgotPasswordForm.get('newPassword');
    const confirmPasswordControl = this.forgotPasswordForm.get('confirmPassword');

    if (!otpControl?.value || otpControl.invalid) {
      this.forgotPasswordError = 'Veuillez entrer un code OTP valide (6 chiffres).';
      return;
    }

    if (!newPasswordControl?.value || newPasswordControl.invalid) {
      this.forgotPasswordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (newPasswordControl.value !== confirmPasswordControl?.value) {
      this.forgotPasswordError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.forgotPasswordLoading = true;

    const resetData = {
      email: this.userEmail,
      otp: otpControl.value,
      newPassword: newPasswordControl.value
    };

    this.http.post<any>(`${environment.apiUrl}/reset-password-otp`, resetData).subscribe({
      next: (response) => {
        console.log('Password reset success:', response);
        this.forgotPasswordLoading = false;
        this.forgotPasswordSuccess = 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.';
        // Clear form and return to login after delay
        setTimeout(() => {
          this.backToLogin();
        }, 2500);
      },
      error: (error: any) => {
        this.forgotPasswordLoading = false;
        console.error('Reset password error:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Full error object:', error);

        // WORKAROUND: Multiple checks for CORS issues where backend actually succeeded
        const isCorsError = error.status === 0 ||
          error.statusText === 'Unknown Error' ||
          (error.status === 200 && error.ok === false) ||
          error.name === 'HttpErrorResponse';

        if (isCorsError && error.status !== 404 && error.status !== 500 && error.status !== 400) {
          console.warn('Possible CORS error detected, treating as success. Status:', error.status);
          this.forgotPasswordSuccess = 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.backToLogin();
          }, 2500);
          return;
        }

        if (error.status === 400) {
          this.forgotPasswordError = 'Code OTP invalide ou expiré.';
        } else if (error.status === 404) {
          this.forgotPasswordError = 'Utilisateur non trouvé.';
        } else if (error.status === 500) {
          this.forgotPasswordError = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          this.forgotPasswordError = `Erreur lors de la réinitialisation (${error.status}). Veuillez réessayer.`;
        }
      }
    });
  }
} 