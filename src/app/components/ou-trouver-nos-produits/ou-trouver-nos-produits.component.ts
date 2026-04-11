import { Component, OnInit, Pipe, PipeTransform, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Pipe({
  name: 'sanitizeUrl',
  standalone: true
})
export class SanitizeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

interface VeterinaryLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  type: string; // 'CABINET' or 'BOUTIQUE'
  featured: boolean;
  matricule?: string; // Optional since Cabinets might not have it or it's named differently
  distance?: number; // Distance from user in km
}

@Component({
  selector: 'app-ou-trouver-nos-produits',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SanitizeUrlPipe],
  templateUrl: './ou-trouver-nos-produits.component.html',
  styleUrls: ['./ou-trouver-nos-produits.component.scss']
})
export class OuTrouverNosProduitsComponent implements OnInit, AfterViewInit {
  isMapMaximized: boolean = false;
  locations: VeterinaryLocation[] = [];
  filteredLocations: VeterinaryLocation[] = [];
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';
  
  // Geolocation
  userLocation: { lat: number; lng: number } | null = null;
  userMarker: L.Marker | null = null;
  isLoadingLocation: boolean = false;
  locationError: string = '';
  private geolocationAttemptId: number = 0;

  // Pagination
  currentPage = 1;
  itemsPerPage = 2;
  paginatedLocations: VeterinaryLocation[] = [];
  Math = Math;

  private map: L.Map | null = null;
  private modalMap: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadLocations();
  }

  ngAfterViewInit(): void {
    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  /**
   * Request user's geolocation
   */
  getUserLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'La géolocalisation n\'est pas supportée par votre navigateur';
      return;
    }

    this.isLoadingLocation = true;
    this.locationError = '';
    this.userLocation = null;
    this.geolocationAttemptId++;
    const currentAttemptId = this.geolocationAttemptId;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success callback
        if (currentAttemptId !== this.geolocationAttemptId) {
          return;
        }
        
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.isLoadingLocation = false;
        this.locationError = '';
        
        // Add user marker to map
        this.addUserMarkerToMap();
        
        // Sort locations by distance
        this.sortLocationsByDistance();
        
        // Update map view to show user location
        if (this.map) {
          this.map.setView([this.userLocation.lat, this.userLocation.lng], 12);
        }
      },
      (error) => {
        // Error callback
        if (currentAttemptId !== this.geolocationAttemptId) {
          return;
        }
        
        // Wait to see if success callback comes through
        setTimeout(() => {
          if (!this.userLocation && currentAttemptId === this.geolocationAttemptId) {
            this.isLoadingLocation = false;
            
            if (error.code === 1) {
              this.locationError = 'Permission de géolocalisation refusée';
            } else if (error.code === 2) {
              this.locationError = 'Position non disponible';
            } else if (error.code === 3) {
              this.locationError = 'Délai d\'attente dépassé';
            } else {
              this.locationError = 'Erreur de géolocalisation';
            }
          }
        }, 100);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Add user marker to map
   */
  addUserMarkerToMap(): void {
    if (!this.map || !this.userLocation) return;

    // Remove existing user marker
    if (this.userMarker) {
      this.userMarker.remove();
    }

    // Create custom icon for user location
    const userIcon = L.divIcon({
      className: 'custom-user-icon',
      html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
               <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
             </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>📍 Votre position</strong>
        </div>
      `);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Sort locations by distance from user
   */
  sortLocationsByDistance(): void {
    if (!this.userLocation) return;

    this.filteredLocations = this.filteredLocations.map(location => ({
      ...location,
      distance: this.calculateDistance(
        this.userLocation!.lat,
        this.userLocation!.lng,
        location.latitude,
        location.longitude
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    this.currentPage = 1;
    this.updatePagination();
    this.updateMapMarkers();
  }

  /**
   * Get formatted distance
   */
  getFormattedDistance(location: any): string {
    if (!location.distance) return '';
    if (location.distance < 1) {
      return `${Math.round(location.distance * 1000)} m`;
    }
    return `${location.distance.toFixed(1)} km`;
  }

  /**
   * Initialize Leaflet map
   */
  initMap(): void {
    // Standard Leaflet icon setup (will be overridden by custom icons per marker)
    const iconRetinaUrl = 'assets/Maps/marker-icon-2x.png';
    const iconUrl = 'assets/Maps/marker-icon.png';
    const shadowUrl = 'assets/Maps/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Initialize main map
    if (!this.map) {
      this.map = L.map('map').setView([46.6, 2.3], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
    //  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      //  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
      }).addTo(this.map);
    }

    // Add markers if locations are loaded
    if (this.filteredLocations.length > 0) {
      this.updateMapMarkers();
    }
  }

  /**
   * Update map markers based on filtered locations
   */
  updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    if (this.filteredLocations.length === 0) return;

    // Define icons
    // Blue icon for Cabinets
    const cabinetIcon = L.icon({
      iconUrl: 'assets/Maps/marker-icon.png',
      iconRetinaUrl: 'assets/Maps/marker-icon-2x.png',
      shadowUrl: 'assets/Maps/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Orange icon for Boutiques - Using SVG DivIcon for distinct look without external assets
    const boutiqueIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ea580c; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
               <span style="color: white; font-size: 14px;">🛍️</span>
             </div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [1, -34]
    });


    // Add markers for each location
    const bounds: L.LatLngBoundsExpression = [];

    this.filteredLocations.forEach(location => {
      // Determine icon based on type
      let icon: any = cabinetIcon;
      if (location.type === 'BOUTIQUE' || location.type === 'Boutique') {
        icon = boutiqueIcon;
      }

      const marker = L.marker([location.latitude, location.longitude], { icon: icon })
        .addTo(this.map!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              ${(location.type === 'BOUTIQUE' || location.type === 'Boutique') ? '<span style="font-size: 16px;">🛍️</span>' : '<span style="font-size: 16px;">🏥</span>'}
              <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${location.name}</h3>
            </div>
            
            <p style="margin: 4px 0; font-size: 12px; color: #4b5563;">
              <span style="margin-right: 4px;">📍</span> ${location.address}, ${location.city}
            </p>
         
            
            <div style="margin-top: 8px;">
               ${location.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">⭐ Principal</span>' : ''}
               ${(location.type === 'BOUTIQUE' || location.type === 'Boutique') ?
            '<span style="background: #ea580c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-left: 4px;">Boutique</span>' :
            '<span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-left: 4px;">Cabinet</span>'}
            </div>
          </div>
        `);

      this.markers.push(marker);
      bounds.push([location.latitude, location.longitude]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Load veterinary locations from API (Both Cabinets and Boutiques)
   */
  loadLocations(): void {
    this.loading = true;
    this.error = '';

    // Wrap each request in catchError to allow partial success
    const cabinets$ = this.http.get<any[]>(`${environment.apiUrl}/cabinets/all`).pipe(
      catchError(err => {
        return of([]); // Return empty array on error
      })
    );

    const boutiques$ = this.http.get<any[]>(`${environment.apiUrl}/boutiques/all`).pipe(
      catchError(err => {
        // Ensure we don't break the whole page if boutiques fail (e.g. 401)
        return of([]);
      })
    );

    forkJoin([cabinets$, boutiques$]).subscribe({
      next: ([cabinets, boutiques]) => {
        // Process Cabinets
        const processedCabinets = cabinets.map(c => ({
          ...c,
          // Ensure address fields are present
          address: c.address || '',
          city: c.city || '',
          phone: c.phone || '',
          type: 'CABINET', // Ensure type is set
          featured: c.featured || false
        }));

        // Process Boutiques
        const processedBoutiques = boutiques.map(b => ({
          ...b,
          // Ensure address fields are present
          address: b.address || '',
          city: b.city || '',
          phone: b.phone || '',
          type: 'BOUTIQUE', // Ensure type is set
          featured: b.featured !== undefined ? b.featured : (b.isFeatured || false)
        }));

        // Merge and sort: featured items first, then by name
        this.locations = [...processedCabinets, ...processedBoutiques].sort((a, b) => {
          // Featured items come first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // If both featured or both not featured, sort by name
          return (a.name || '').localeCompare(b.name || '');
        });
        this.filteredLocations = this.locations;

        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;

        if (this.locations.length === 0) {
          this.error = 'Aucun point de vente trouvé ou erreur de connexion.';
        }

        // Update map markers after loading
        if (this.map) {
          this.updateMapMarkers();
        }
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des points de vente';
        this.loading = false;
      }
    });
  }

  /**
   * Filter locations by type
   */
  filterLocations(filter: string): void {
    this.selectedFilter = filter;

    switch (filter) {
      case 'all':
        this.filteredLocations = this.locations;
        break;
      case 'CABINET':
        this.filteredLocations = this.locations.filter(loc => loc.type === 'CABINET');
        break;
      case 'BOUTIQUE':
        this.filteredLocations = this.locations.filter(loc => loc.type === 'BOUTIQUE' || loc.type === 'Boutique');
        break;
      default:
        this.filteredLocations = this.locations;
    }

    // Sort filtered locations: featured first, then by name
    this.filteredLocations = this.filteredLocations.sort((a, b) => {
      // Featured items come first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // If both featured or both not featured, sort by name
      return (a.name || '').localeCompare(b.name || '');
    });

    // Update pagination and map markers when filter changes
    this.currentPage = 1;
    this.updatePagination();
    this.updateMapMarkers();
  }

  /**
   * Get map URL with all markers
   * Note: OpenStreetMap embed only supports one marker, so we'll use the first location
   * For multiple markers, consider using Leaflet.js or Google Maps API
   */
  getMapUrl(): string {
    if (this.filteredLocations.length === 0) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=9.0,36.0,11.0,38.0&layer=mapnik';
    }

    // If only one location, show it directly
    if (this.filteredLocations.length === 1) {
      const loc = this.filteredLocations[0];
      const zoom = 15;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.01},${loc.latitude - 0.01},${loc.longitude + 0.01},${loc.latitude + 0.01}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`;
    }

    // For multiple locations, calculate bounds and show center
    const lats = this.filteredLocations.map(loc => loc.latitude);
    const lngs = this.filteredLocations.map(loc => loc.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounds (10%)
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Show first location as marker (OSM limitation)
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}&layer=mapnik&marker=${this.filteredLocations[0].latitude},${this.filteredLocations[0].longitude}`;
  }

  /**
   * Get Google Maps URL with all markers using My Maps approach
   */
  getGoogleMapsUrl(): string {
    if (this.filteredLocations.length === 0) {
      return 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d100000!2d10.2!3d36.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890';
    }

    // For single location
    if (this.filteredLocations.length === 1) {
      const loc = this.filteredLocations[0];
      return `https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // For multiple locations, create a search query with all locations
    // This will show multiple markers on the map
    const queries = this.filteredLocations.map(loc =>
      `${loc.latitude},${loc.longitude}`
    ).join('|');

    // Calculate center
    const lats = this.filteredLocations.map(loc => loc.latitude);
    const lngs = this.filteredLocations.map(loc => loc.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Use the first location as primary marker, but center on all
    return `https://maps.google.com/maps?q=${queries.split('|')[0]}&t=&z=12&ie=UTF8&iwloc=&output=embed&center=${centerLat},${centerLng}`;
  }

  /**
   * Get URL to view all locations on Google Maps (opens in new tab)
   * Opens Google Maps with all locations visible
   */
  viewAllOnGoogleMaps(): void {
    if (this.filteredLocations.length === 0) return;

    if (this.filteredLocations.length === 1) {
      // Single location - open directly
      const loc = this.filteredLocations[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
      window.open(url, '_blank');
      return;
    }

    // For multiple locations, use the directions API which shows all points as markers
    // This is the most reliable way to show multiple markers without API key
    const coordinates = this.filteredLocations.map(loc =>
      `${loc.latitude},${loc.longitude}`
    ).join('/');

    const url = `https://www.google.com/maps/dir/${coordinates}`;
    window.open(url, '_blank');
  }

  /**
   * Get directions to location
   */
  getDirections(location: VeterinaryLocation): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * View location on map
   */
  viewOnMap(location: VeterinaryLocation): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Call location
   */
  callLocation(phone: string): void {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  navigateToVetSpace() {
    this.router.navigate(['/formulaireUser']);
  }

  navigateBack() {
    this.router.navigate(['/espace-proprietaire']);
  }

  maximizeMap() {
    this.isMapMaximized = true;
    document.body.style.overflow = 'hidden';

    // Initialize modal map after a short delay
    setTimeout(() => {
      if (!this.modalMap) {
        // Set initial view - use user location if available, otherwise default
        const initialLat = this.userLocation ? this.userLocation.lat : 36.8;
        const initialLng = this.userLocation ? this.userLocation.lng : 10.2;
        const initialZoom = this.userLocation ? 13 : 10;
        
        this.modalMap = L.map('modalMap').setView([initialLat, initialLng], initialZoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19
        }).addTo(this.modalMap);

        // Add user location marker if available
        if (this.userLocation) {
          const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
                     <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
                   </div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });

          L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
            .addTo(this.modalMap)
            .bindPopup(`
              <div style="text-align: center;">
                <strong>📍 Votre position</strong>
              </div>
            `);
        }

        // Add location markers to modal map
        const bounds: L.LatLngBoundsExpression = [];
        
        // Define icons for locations
        const cabinetIcon = L.icon({
          iconUrl: 'assets/Maps/marker-icon.png',
          iconRetinaUrl: 'assets/Maps/marker-icon-2x.png',
          shadowUrl: 'assets/Maps/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const boutiqueIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #ea580c; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                   <span style="color: white; font-size: 14px;">🛍️</span>
                 </div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [1, -34]
        });
        
        this.filteredLocations.forEach(location => {
          // Determine icon based on type
          let icon: any = cabinetIcon;
          if (location.type === 'BOUTIQUE' || location.type === 'Boutique') {
            icon = boutiqueIcon;
          }
          
          L.marker([location.latitude, location.longitude], { icon: icon })
            .addTo(this.modalMap!)
            .bindPopup(`
              <div style="min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  ${(location.type === 'BOUTIQUE' || location.type === 'Boutique') ? '<span style="font-size: 16px;">🛍️</span>' : '<span style="font-size: 16px;">🏥</span>'}
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${location.name}</h3>
                </div>
                <p style="margin: 4px 0; font-size: 12px;">📍 ${location.address}, ${location.city}</p>
                ${location.distance ? `<p style="margin: 4px 0; font-size: 12px; color: #3b82f6; font-weight: bold;">📏 ${this.getFormattedDistance(location)}</p>` : ''}
                <div style="margin-top: 8px;">
                  ${location.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Principal</span>' : ''}
                  ${(location.type === 'BOUTIQUE' || location.type === 'Boutique') ?
                    '<span style="background: #ea580c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-left: 4px;">Boutique</span>' :
                    '<span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-left: 4px;">Cabinet</span>'}
                </div>
              </div>
            `);
          bounds.push([location.latitude, location.longitude]);
        });

        // Only fit bounds if user location is not available
        // If user location exists, keep the centered view on user
        if (!this.userLocation && bounds.length > 0) {
          this.modalMap.fitBounds(bounds, { padding: [50, 50] });
        }
        // If user location exists, the map is already centered on user position with zoom 13
        // Don't call fitBounds to maintain the zoom level
      }
    }, 100);
  }

  minimizeMap() {
    this.isMapMaximized = false;
    document.body.style.overflow = 'auto';

    // Clean up modal map
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = null;
    }
  }

  /**
   * Update pagination
   */
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLocations = this.filteredLocations.slice(startIndex, endIndex);
  }

  /**
   * Get total pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredLocations.length / this.itemsPerPage);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Get page numbers array with ellipsis for better UX
   */
  getPageNumbers(): (number | string)[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages if total is small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 3) {
      // Near the beginning
      for (let i = 2; i <= Math.min(maxVisiblePages, totalPages - 1); i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near the end
      pages.push('...');
      for (let i = totalPages - maxVisiblePages + 1; i < totalPages; i++) {
        pages.push(i);
      }
      pages.push(totalPages);
    } else {
      // In the middle
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  }
}
