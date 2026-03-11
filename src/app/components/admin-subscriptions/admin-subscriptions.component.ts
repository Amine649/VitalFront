import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresseCabinet: string;
  numMatricule: string;
  status: string;
  subscription: any;
}

interface Subscription {
  id: number;
  user: User;
  subscriptionType: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-subscriptions.component.html',
  styleUrl: './admin-subscriptions.component.scss'
})
export class AdminSubscriptionsComponent implements OnInit {
  users: User[] = [];
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];

  loading = false;
  error = '';
  successMessage = '';

  // Assign subscription modal
  showAssignModal = false;
  selectedUserId: number | null = null;
  selectedSubscriptionType = '';
  assignLoading = false;
  userSearchQuery = '';
  filteredAvailableUsers: User[] = [];

  // Update subscription modal
  showUpdateModal = false;
  selectedSubscription: Subscription | null = null;
  updateLoading = false;

  // Delete confirmation modal
  showDeleteModal = false;
  deleteLoading = false;

  // Filters
  statusFilter = 'ALL';
  searchQuery = '';

  subscriptionTypes = [
    { value: 'ONE_MONTH', label: '1 mois' },
    { value: 'THREE_MONTHS', label: '3 mois' },
    { value: 'SIX_MONTHS', label: '6 mois' }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadSubscriptions();
  }

  /**
   * Get request options with credentials for JSON
   * Cookie is automatically sent by browser when withCredentials is true
   */
  private getRequestOptions() {
    return {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Get request options with credentials for form data
   */
  private getRequestOptionsFormData() {
    return {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  }

  /**
   * Get request options with credentials (no Content-Type for FormData)
   */
  private getRequestOptionsMultipart() {
    return {
      withCredentials: true
    };
  }

  /**
   * Load all users
   */
  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiUrl}/users/all`, this.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.users = data;
          console.log('Users loaded:', data.length);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.error = this.getFriendlyErrorMessage(error);
        }
      });
  }

  /**
   * Load all subscriptions
   */
  loadSubscriptions(): void {
    this.loading = true;
    this.http.get<Subscription[]>(`${environment.apiUrl}/subscriptions/all`, this.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.subscriptions = data;
          this.applyFilters();
          this.loading = false;
          console.log('Subscriptions loaded:', data.length);
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.error = this.getFriendlyErrorMessage(error);
          this.loading = false;
        }
      });
  }

  /**
   * Open assign subscription modal
   */
  openAssignModal(): void {
    this.showAssignModal = true;
    this.selectedUserId = null;
    this.selectedSubscriptionType = '';
    this.userSearchQuery = '';
    this.error = '';
    this.successMessage = '';
    this.filterAvailableUsers();
  }

  /**
   * Close assign modal
   */
  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedUserId = null;
    this.selectedSubscriptionType = '';
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Open update subscription modal
   */
  openUpdateModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    this.selectedSubscriptionType = subscription.subscriptionType;
    this.showUpdateModal = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Close update modal
   */
  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedSubscription = null;
    this.selectedSubscriptionType = '';
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    this.showDeleteModal = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Close delete modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedSubscription = null;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Assign subscription to user
   */
  assignSubscription(): void {
    if (!this.selectedUserId || !this.selectedSubscriptionType) {
      this.error = 'Veuillez sélectionner un utilisateur et un type d\'abonnement';
      return;
    }

    this.assignLoading = true;
    this.error = '';
    this.successMessage = '';

    // Create form-urlencoded body
    const body = new URLSearchParams();
    body.set('subscriptionType', this.selectedSubscriptionType);

    this.http.post(
      `${environment.apiUrl}/subscriptions/assign/${this.selectedUserId}`,
      body.toString(),
      {
        ...this.getRequestOptionsFormData(),
        responseType: 'text' as 'json'
      }
    ).subscribe({
      next: (response) => {
        this.assignLoading = false;
        this.successMessage = 'Abonnement assigné avec succès ! Un email a été envoyé à l\'utilisateur.';
        console.log('Success:', response);

        // Reload data
        setTimeout(() => {
          this.loadUsers();
          this.loadSubscriptions();
          this.closeAssignModal();
        }, 2000);
      },
      error: (error) => {
        this.assignLoading = false;
        console.error('Error assigning subscription:', error);

        // Check if it's actually a success (status 200) but Angular treated it as error
        if (error.status === 200) {
          this.successMessage = 'Abonnement assigné avec succès ! Un email a été envoyé à l\'utilisateur.';
          setTimeout(() => {
            this.loadUsers();
            this.loadSubscriptions();
            this.closeAssignModal();
          }, 2000);
        } else {
          this.error = this.getFriendlyErrorMessage(error);
        }
      }
    });
  }

  /**
   * Apply filters to subscriptions
   */
  applyFilters(): void {
    let filtered = [...this.subscriptions];

    // Status filter
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(sub => sub.user.status === this.statusFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.user.nom.toLowerCase().includes(query) ||
        sub.user.prenom.toLowerCase().includes(query) ||
        sub.user.email.toLowerCase().includes(query) ||
        sub.user.numMatricule.toLowerCase().includes(query)
      );
    }

    this.filteredSubscriptions = filtered;
  }

  /**
   * Get subscription type label
   */
  getSubscriptionLabel(type: string): string {
    const sub = this.subscriptionTypes.find(s => s.value === type);
    return sub ? sub.label : type;
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get users without active subscription
   */
  getUsersWithoutSubscription(): User[] {
    return this.users.filter(user => user.status !== 'ACTIVE');
  }

  /**
   * Filter available users based on search query
   */
  filterAvailableUsers(): void {
    // Show all users without any constraint
    const availableUsers = this.users;

    if (!this.userSearchQuery) {
      this.filteredAvailableUsers = availableUsers;
      return;
    }

    const query = this.userSearchQuery.toLowerCase();
    this.filteredAvailableUsers = availableUsers.filter(user =>
      user.nom.toLowerCase().includes(query) ||
      user.prenom.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.numMatricule.toLowerCase().includes(query)
    );
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Check if subscription is expiring soon (within 7 days)
   */
  isExpiringSoon(endDate: string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  }

  /**
   * Get count of active subscriptions
   */
  getActiveCount(): number {
    return this.subscriptions.filter(s => s.user.status === 'ACTIVE').length;
  }

  /**
   * Get count of inactive users
   */
  getInactiveCount(): number {
    return this.users.filter(u => u.status === 'INACTIVE').length;
  }

  /**
   * Get count of expired users
   */
  getExpiredCount(): number {
    return this.users.filter(u => u.status === 'EXPIRED').length;
  }

  /**
   * Get total subscriptions count
   */
  getTotalCount(): number {
    return this.subscriptions.length;
  }

  /**
   * Update subscription
   */
  updateSubscription(): void {
    if (!this.selectedSubscription || !this.selectedSubscriptionType) {
      this.error = 'Veuillez sélectionner un type d\'abonnement';
      return;
    }

    this.updateLoading = true;
    this.error = '';
    this.successMessage = '';

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('subscriptionType', this.selectedSubscriptionType);

    this.http.put(
      `${environment.apiUrl}/subscriptions/update/${this.selectedSubscription.id}`,
      formData,
      {
        ...this.getRequestOptionsMultipart(),
        responseType: 'text' as 'json'
      }
    ).subscribe({
      next: () => {
        this.updateLoading = false;
        this.successMessage = 'Abonnement mis à jour avec succès ! Un email a été envoyé à l\'utilisateur.';

        // Reload data
        setTimeout(() => {
          this.loadUsers();
          this.loadSubscriptions();
          this.closeUpdateModal();
        }, 2000);
      },
      error: (error) => {
        this.updateLoading = false;
        console.error('Error updating subscription:', error);

        // Check if it's actually a success (status 200) but Angular treated it as error
        if (error.status === 200) {
          this.successMessage = 'Abonnement mis à jour avec succès ! Un email a été envoyé à l\'utilisateur.';
          setTimeout(() => {
            this.loadUsers();
            this.loadSubscriptions();
            this.closeUpdateModal();
          }, 2000);
        } else {
          this.error = this.getFriendlyErrorMessage(error);
        }
      }
    });
  }

  /**
   * Delete subscription
   */
  deleteSubscription(): void {
    if (!this.selectedSubscription) {
      this.error = 'Aucun abonnement sélectionné';
      return;
    }

    this.deleteLoading = true;
    this.error = '';
    this.successMessage = '';

    this.http.delete(
      `${environment.apiUrl}/subscriptions/delete/${this.selectedSubscription.id}`,
      this.getRequestOptions()
    ).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.successMessage = 'Abonnement supprimé avec succès !';

        // Reload data
        setTimeout(() => {
          this.loadUsers();
          this.loadSubscriptions();
          this.closeDeleteModal();
        }, 1500);
      },
      error: (error) => {
        this.deleteLoading = false;
        console.error('Error deleting subscription:', error);
        this.error = this.getFriendlyErrorMessage(error);
      }
    });
  }

  /**
   * Get friendly error message from HTTP error
   */
  private getFriendlyErrorMessage(error: any): string {
    // Check for authentication errors
    if (error.status === 401 || error.status === 403) {
      return 'Session expirée ou accès non autorisé. Veuillez vous reconnecter.';
    }

    // Check for network errors
    if (error.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }

    // Check for server errors
    if (error.status >= 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    // Check for not found errors
    if (error.status === 404) {
      return 'Ressource non trouvée. Veuillez contacter l\'administrateur.';
    }

    // Check for bad request with specific message
    if (error.status === 400 && error.error) {
      let errorMessage = '';

      // Extract error message from different formats
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }

      // Check for specific error patterns and return friendly messages
      if (errorMessage.includes('a déjà un abonnement') || errorMessage.includes('already has a subscription')) {
        return 'Cet utilisateur possède déjà un abonnement actif. Veuillez d\'abord supprimer ou attendre l\'expiration de l\'abonnement existant.';
      }

      // Return the error message if it's user-friendly
      if (errorMessage) {
        return errorMessage;
      }
    }

    // Default friendly message
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
