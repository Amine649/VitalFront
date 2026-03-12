import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-espace-commercial',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
    templateUrl: './espace-commercial.component.html',
    styleUrls: ['./espace-commercial.component.scss']
})
export class EspaceCommercialComponent {
    matriculeForm: FormGroup;
    passwordForm: FormGroup;
    loading = false;
    error = '';
    success = '';

    // UI State
    showProfileDropdown = false;
    showPasswordModal = false;
    mobileMenuOpen = false;

    // Password change
    passwordLoading = false;
    passwordError = '';
    passwordSuccess = '';

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.matriculeForm = this.formBuilder.group({
            matricule: ['', [Validators.required, Validators.minLength(3)]]
        });

        this.passwordForm = this.formBuilder.group({
            oldPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });
    }

    get f() { return this.matriculeForm.controls; }

    validateMatricule() {
        this.error = '';
        this.success = '';

        if (this.matriculeForm.invalid) {
            this.error = 'Veuillez entrer un matricule fiscale valide.';
            return;
        }

        this.loading = true;
        const matricule = this.matriculeForm.value.matricule;

        this.http.get<any>(`${environment.apiUrl}/commercial/orders/check/${matricule}`, { withCredentials: true })
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    sessionStorage.setItem('validatedMatricule', matricule);

                    if (response) {
                        if (response.vetId || response.id) {
                            sessionStorage.setItem('vetId', response.vetId || response.id);
                        }
                        if (response.nom || response.name) {
                            sessionStorage.setItem('vetName', response.nom || response.name);
                        }
                        if (response.prenom || response.firstName) {
                            sessionStorage.setItem('vetPrenom', response.prenom || response.firstName);
                        }
                    }

                    this.success = 'Matricule validé avec succès !';
                    setTimeout(() => {
                        this.router.navigate(['/espace-commercial/commande']);
                    }, 800);
                },
                error: (error) => {
                    this.loading = false;

                    if (error.status === 404) {
                        this.error = 'Matricule fiscale non trouvé. Veuillez vérifier et réessayer.';
                    } else if (error.status === 400) {
                        this.error = 'Format de matricule invalide.';
                    } else if (error.status === 401 || error.status === 403) {
                        this.error = 'Accès non autorisé. Veuillez vous reconnecter.';
                        setTimeout(() => this.router.navigate(['/login']), 2000);
                    } else {
                        this.error = 'Erreur lors de la validation. Veuillez réessayer.';
                    }
                }
            });
    }

    toggleProfileDropdown() {
        this.showProfileDropdown = !this.showProfileDropdown;
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false;
    }

    openPasswordModal() {
        this.showPasswordModal = true;
        this.showProfileDropdown = false;
        this.passwordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    closePasswordModal() {
        this.showPasswordModal = false;
        this.passwordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    changePassword() {
        this.passwordError = '';
        this.passwordSuccess = '';

        if (this.passwordForm.invalid) {
            this.passwordError = 'Veuillez remplir tous les champs.';
            return;
        }

        const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

        if (newPassword !== confirmPassword) {
            this.passwordError = 'Les mots de passe ne correspondent pas.';
            return;
        }

        if (newPassword.length < 6) {
            this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
            return;
        }

        this.passwordLoading = true;

        this.http.put<any>(
            `${environment.apiUrl}/user/change-password`,
            { oldPassword, newPassword },
            { withCredentials: true }
        ).subscribe({
            next: () => {
                this.passwordLoading = false;
                this.passwordSuccess = 'Mot de passe modifié avec succès !';
                setTimeout(() => this.closePasswordModal(), 1500);
            },
            error: (error) => {
                this.passwordLoading = false;

                if (error.status === 401) {
                    this.passwordError = 'Ancien mot de passe incorrect.';
                } else if (error.status === 400) {
                    this.passwordError = error.error?.message || 'Données invalides.';
                } else {
                    this.passwordError = 'Erreur lors du changement de mot de passe.';
                }
            }
        });
    }

    logout() {
        this.authService.logout('/login');
    }
}
