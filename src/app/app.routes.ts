import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { CommercialGuard } from './guards/commercial.guard';
import { MatriculeValidatedGuard } from './guards/matricule-validated.guard';

export const routes: Routes = [
  // Home and public pages - Keep in initial bundle (most visited)
  { 
    path: '', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  
  // Formulaires - Lazy loaded
  { 
    path: 'formulaireUser', 
    loadComponent: () => import('./components/formulaire/formulaire.component').then(m => m.FormulaireComponent)
  },
  { 
    path: 'formulaireVet', 
    loadComponent: () => import('./components/formulaire-vet/formulaire-vet.component').then(m => m.FormulaireVetComponent)
  },
  { 
    path: 'confirmation', 
    loadComponent: () => import('./components/confirmation/confirmation.component').then(m => m.ConfirmationComponent)
  },
  
  // Admin section - Lazy loaded (heavy module)
  {
    path: 'admin',
    loadComponent: () => import('./components/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      { 
        path: 'subscriptions', 
        loadComponent: () => import('./components/admin-subscriptions/admin-subscriptions.component').then(m => m.AdminSubscriptionsComponent)
      },
      { 
        path: 'veterinaires', 
        loadComponent: () => import('./components/admin-veterinaires/admin-veterinaires.component').then(m => m.AdminVeterinairesComponent)
      },
      { 
        path: 'cabinets', 
        loadComponent: () => import('./components/admin-cabinets/admin-cabinets.component').then(m => m.AdminCabinetsComponent)
      },
      { 
        path: 'boutiques', 
        loadComponent: () => import('./components/admin-boutiques/admin-boutiques.component').then(m => m.AdminBoutiquesComponent)
      },
      { 
        path: 'products', 
        loadComponent: () => import('./components/admin-products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      { 
        path: 'blogs', 
        loadComponent: () => import('./components/admin-blogs/admin-blogs.component').then(m => m.AdminBlogsComponent)
      }
    ]
  },
  
  // Public pages - Lazy loaded
  { 
    path: 'espace-proprietaire', 
    loadComponent: () => import('./components/espace-proprietaire/espace-proprietaire.component').then(m => m.EspaceProprietaireComponent)
  },
  { 
    path: 'ou-trouver-nos-produits', 
    loadComponent: () => import('./components/ou-trouver-nos-produits/ou-trouver-nos-produits.component').then(m => m.OuTrouverNosProduitsComponent)
  },
  { 
    path: 'conseil-articles/:id', 
    loadComponent: () => import('./components/conseil-articles/conseil-articles.component').then(m => m.ConseilArticlesComponent)
  },
  
  // Veterinaire section - Lazy loaded with auth guard
  { 
    path: 'espace-veterinaire', 
    loadComponent: () => import('./components/espace-veterinaire/espace-veterinaire.component').then(m => m.EspaceVeterinaireComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'produits-veterinaire', 
    loadComponent: () => import('./components/produits-veterinaire/produits-veterinaire.component').then(m => m.ProduitsVeterinaireComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'panier', 
    loadComponent: () => import('./components/panier/panier.component').then(m => m.PanierComponent),
    canActivate: [authGuard]
  },
  
  // Commercial section - Lazy loaded with guards
  { 
    path: 'espace-commercial', 
    loadComponent: () => import('./components/espace-commercial/espace-commercial.component').then(m => m.EspaceCommercialComponent),
    canActivate: [CommercialGuard]
  },
  { 
    path: 'espace-commercial/commande', 
    loadComponent: () => import('./components/commercial-commande/commercial-commande.component').then(m => m.CommercialCommandeComponent),
    canActivate: [CommercialGuard, MatriculeValidatedGuard]
  },
  { 
    path: 'espace-commercial/panier', 
    loadComponent: () => import('./components/panier-commercial/panier-commercial.component').then(m => m.PanierCommercialComponent),
    canActivate: [CommercialGuard, MatriculeValidatedGuard]
  },
  
  { path: '**', redirectTo: '' },
];