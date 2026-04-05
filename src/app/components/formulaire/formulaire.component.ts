import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DemandeService } from '../../services/demande.service';
import { Demande } from '../../models/demande.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorSanitizerService } from '../../services/error-sanitizer.service';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-formulaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxIntlTelInputModule],
  templateUrl: './formulaire.component.html',
  styleUrl: './formulaire.component.scss'
})
export class FormulaireComponent implements OnInit {
  demandeForm: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  successMessage = '';

  // Configuration pour ngx-intl-tel-input
  separateDialCode = true;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.France,
    CountryISO.Belgium,
    CountryISO.Switzerland,
    CountryISO.Morocco,
    CountryISO.Algeria,
    CountryISO.Tunisia
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private demandeService: DemandeService,
    private errorSanitizer: ErrorSanitizerService
  ) {
    this.demandeForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      adresseCabinet: ['', Validators.required],
      numMatricule: ['', Validators.required]

    });
  }

  ngOnInit() {
    // No authentication check - anyone can register
  }

  get f() { return this.demandeForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';

    if (this.demandeForm.invalid) {
      return;
    }

    this.loading = true;

    // Préparation des données pour l'API selon le format requis
    const telephoneValue = this.demandeForm.value.telephone;
    let telephone = '';

    // Vérifier si la valeur du téléphone est un objet (cas de ngx-intl-tel-input)
    if (telephoneValue && typeof telephoneValue === 'object') {
      // Utiliser le numéro international sans le +
      telephone = telephoneValue.internationalNumber.replace(/\s/g, '').replace(/\+/g, '');
    } else {
      telephone = telephoneValue || '';
    }

    const userData = {
      nom: this.demandeForm.value.nom,
      prenom: this.demandeForm.value.prenom,
      email: this.demandeForm.value.email,
      telephone: telephone,
      adresseCabinet: this.demandeForm.value.adresseCabinet,
      numMatricule: this.demandeForm.value.numMatricule
    };

    this.demandeService.registerUser(userData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Inscription réussie ! Vous serez contacté pour finaliser votre compte.';

        // Stockage des données dans le localStorage pour la page de confirmation
        localStorage.setItem('demande', JSON.stringify(userData));

        // Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/confirmation']);
        }, 2000);
      },
      error: (error: any) => {
        this.loading = false;

        // Handle specific error scenarios with user-friendly messages
        if (error.error && typeof error.error === 'string') {
          const errorText = error.error.toLowerCase();

          if (errorText.includes('matricule')) {
            this.error = 'Le numéro matricule que vous avez saisi n\'existe pas dans notre service. Veuillez Contacter Service Commercial';
          } else if (errorText.includes('email')) {
            this.error = 'Cette adresse email est déjà utilisée.';
          } else {
            this.error = this.errorSanitizer.sanitizeError(error);
          }
        } else {
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'inscription');
        }
      }
    });
  }
} 