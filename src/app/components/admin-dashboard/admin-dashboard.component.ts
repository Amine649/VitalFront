import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';

interface DashboardStats {
  // Users & Subscriptions
  totalUsers: number;
  activeSubscriptions: number;
  inactiveUsers: number;
  expiredSubscriptions: number;

  // Products
  totalProducts: number;
  productsByCategory: { category: string; count: number; }[];

  // Cabinets
  totalCabinets: number;
  featuredCabinets: number;

  // Veterinaires
  totalVeterinaires: number;

  // Recent Activity
  recentSubscriptions: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    activeSubscriptions: 0,
    inactiveUsers: 0,
    expiredSubscriptions: 0,
    totalProducts: 0,
    productsByCategory: [],
    totalCabinets: 0,
    featuredCabinets: 0,
    totalVeterinaires: 0,
    recentSubscriptions: []
  };

  loading = true;
  error = '';

  // Chart data
  subscriptionChartData: any[] = [];
  productChartData: any[] = [];

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  /**
   * Get request options with credentials
   */
  private getRequestOptions() {
    return {
      withCredentials: true
    };
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData() {
    this.loading = true;
    this.error = '';

    forkJoin({
      users: this.http.get<any[]>(`${environment.apiUrl}/users/all`, this.getRequestOptions()).pipe(
        catchError(err => {
          console.error('Error loading users:', err);
          return of([]);
        })
      ),
      subscriptions: this.http.get<any[]>(`${environment.apiUrl}/subscriptions/all`, this.getRequestOptions()).pipe(
        catchError(err => {
          console.error('Error loading subscriptions:', err);
          return of([]);
        })
      ),
      products: this.productService.getAllProducts().pipe(
        catchError(err => {
          console.error('Error loading products:', err);
          return of([]);
        })
      ),
      cabinets: this.http.get<any[]>(`${environment.apiUrl}/cabinets/all`, this.getRequestOptions()).pipe(
        catchError(err => {
          console.error('Error loading cabinets:', err);
          return of([]);
        })
      ),
      veterinaires: this.http.get<any[]>(`${environment.apiUrl}/ourveterinaires/all`, this.getRequestOptions()).pipe(
        catchError(err => {
          console.error('Error loading veterinaires:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (data) => {
        this.processData(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Erreur lors du chargement du tableau de bord';
        this.loading = false;
      }
    });
  }

  /**
   * Process all data and calculate statistics
   */
  private processData(data: any) {
    // Users statistics
    const users = data.users || [];
    this.stats.totalUsers = users.length;
    this.stats.inactiveUsers = users.filter((u: any) => u.status === 'INACTIVE').length;

    // Subscriptions statistics
    const subscriptions = data.subscriptions || [];
    this.stats.activeSubscriptions = subscriptions.filter((s: any) => s.user?.status === 'ACTIVE').length;

    this.stats.expiredSubscriptions = subscriptions.filter((s: any) => s.user?.status === 'EXPIRED').length;



    // Recent subscriptions (last 5)
    this.stats.recentSubscriptions = subscriptions
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);

    // Subscription chart data
    this.subscriptionChartData = [
      { label: 'Actifs', value: this.stats.activeSubscriptions, color: '#10b981' },
      { label: 'Inactifs', value: this.stats.inactiveUsers, color: '#6b7280' },
      { label: 'Expirés', value: this.stats.expiredSubscriptions, color: '#ef4444' }
    ];

    // Products statistics
    const products = data.products || [];
    this.stats.totalProducts = products.length;

    // Products by category
    const categoryCount: any = {};
    products.forEach((p: any) => {
      const cat = p.category || 'Autre';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    this.stats.productsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count: count as number
    }));

    // Product chart data
    this.productChartData = this.stats.productsByCategory.map(item => ({
      label: item.category === 'CHIEN' ? '🐶 Chien' : item.category === 'CHAT' ? '🐱 Chat' : item.category,
      value: item.count,
      color: item.category === 'CHIEN' ? '#3b82f6' : '#ef4444'
    }));

    // Cabinets statistics
    const cabinets = data.cabinets || [];
    this.stats.totalCabinets = cabinets.filter((c: any) => c.type === 'BOUTIQUE').length;
    this.stats.featuredCabinets = cabinets.filter((c: any) => c.featured === true).length;

    // Veterinaires statistics
    this.stats.totalVeterinaires = (data.veterinaires || []).length;
  }

  /**
   * Get subscription type label
   */
  getSubscriptionLabel(type: string): string {
    const labels: any = {
      'ONE_MONTH': '1 mois',
      'THREE_MONTHS': '3 mois',
      'SIX_MONTHS': '6 mois',
      'ONE_YEAR': '1 an'
    };
    return labels[type] || type;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Get percentage for chart
   */
  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * Refresh dashboard
   */
  refresh() {
    this.loadDashboardData();
  }
}
