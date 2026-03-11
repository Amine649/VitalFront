import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-formulaire-vet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './formulaire-vet.component.html',
  styleUrl: './formulaire-vet.component.scss'
})
export class FormulaireVetComponent implements OnInit {
  subscriptionForm: FormGroup;
  userData: any = null;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  showConfirmation = false;
  submittedData: any = null;

  subscriptionTypes = [
    { value: 'ONE_MONTH', label: '1 mois', price: '29€/mois' },
    { value: 'THREE_MONTHS', label: '3 mois', price: '25€/mois (75€ total)' },
    { value: 'SIX_MONTHS', label: '6 mois', price: '20€/mois (120€ total)' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.subscriptionForm = this.formBuilder.group({
      subscriptionType: ['', Validators.required],
      image: [null, Validators.required]
    });
  }

  ngOnInit() {
    // No need to check authentication here - it's a public page
    // Users can subscribe without being logged in
    this.loadUserData();
  }

  loadUserData(): void {
    // Try to load user data if they're logged in (optional)
    this.loading = true;

    this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.userData = data;
        this.loading = false;
        
        // Store userId if not already in localStorage
        if (data.id || data.userId) {
          const id = data.id || data.userId;
          localStorage.setItem('userId', id.toString());
        }
      },
      error: (error) => {
        this.loading = false;
        // Don't show error - it's okay if user is not logged in
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.match(/image\/(png|jpg|jpeg)/)) {
        this.error = 'Veuillez sélectionner une image (PNG, JPG, JPEG)';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'La taille de l\'image ne doit pas dépasser 5MB';
        return;
      }

      this.selectedFile = file;
      this.subscriptionForm.patchValue({ image: file });

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.error = '';
    }
  }

  onSubmit(): void {
    if (this.subscriptionForm.invalid || !this.selectedFile) {
      this.error = 'Veuillez remplir tous les champs requis';
      return;
    }

    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.error = 'Veuillez vous connecter pour souscrire à un abonnement.';
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('subscriptionType', this.subscriptionForm.value.subscriptionType);
    formData.append('image', this.selectedFile);

    this.http.post(`${environment.apiUrl}/veterinaires/update`, formData, { 
      withCredentials: true, 
      responseType: 'text' 
    }).subscribe({
      next: () => {
        this.submitting = false;
        
        // Get subscription details
        const selectedSubscription = this.subscriptionTypes.find(
          sub => sub.value === this.subscriptionForm.value.subscriptionType
        );
        
        // Store submitted data for recap
        this.submittedData = {
          nom: this.userData.nom,
          prenom: this.userData.prenom,
          email: this.userData.email,
          telephone: this.userData.telephone,
          adresseCabinet: this.userData.adresseCabinet,
          subscriptionType: selectedSubscription?.label || '',
          subscriptionPrice: selectedSubscription?.price || '',
          ordonnanceUploaded: true
        };
        
        // Show confirmation page
        this.showConfirmation = true;
      },
      error: (error) => {
        this.submitting = false;
        console.error('Subscription update error:', error);
        
        if (error.status === 401) {
          this.error = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          this.error = 'Données invalides. Veuillez vérifier vos informations.';
        } else {
          this.error = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.subscriptionForm.patchValue({ image: null });
  }

  goBack(): void {
    this.router.navigate(['/espace-veterinaire']);
  }
}
