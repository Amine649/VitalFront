import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Blog {
  id: number;
  title: string;
  description: string;
  type: 'VETERINAIRE' | 'PROPRIETAIRE';
  pet: 'CAT' | 'DOG';
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-blogs.component.html',
  styleUrls: ['./admin-blogs.component.scss']
})
export class AdminBlogsComponent implements OnInit {
  blogs: Blog[] = [];
  filteredBlogs: Blog[] = [];
  
  // Filters
  searchTerm: string = '';
  selectedType: string = 'ALL';
  selectedPet: string = 'ALL';
  
  // Modals
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  
  // Form data
  blogForm = {
    title: '',
    description: '',
    type: 'PROPRIETAIRE' as 'VETERINAIRE' | 'PROPRIETAIRE',
    pet: 'CAT' as 'CAT' | 'DOG',
    pdfFile: null as File | null
  };
  
  selectedBlog: Blog | null = null;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // Notification
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  };
  
  // Loading
  isLoading: boolean = false;
  
  // Expose Math for template
  Math = Math;
  
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBlogs();
  }

  loadBlogs() {
    this.isLoading = true;

    this.http.get<Blog[]>(`${this.apiUrl}/blogs/all`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.blogs = data;
          this.filterBlogs();
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorMessage('Erreur lors du chargement des blogs');
          this.isLoading = false;
        }
      });
  }

  filterBlogs() {
    this.filteredBlogs = this.blogs.filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           blog.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = this.selectedType === 'ALL' || blog.type === this.selectedType;
      const matchesPet = this.selectedPet === 'ALL' || blog.pet === this.selectedPet;
      
      return matchesSearch && matchesType && matchesPet;
    });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.currentPage = 1;
    this.filterBlogs();
  }

  onTypeChange(value: string) {
    this.selectedType = value;
    this.currentPage = 1;
    this.filterBlogs();
  }

  onPetChange(value: string) {
    this.selectedPet = value;
    this.currentPage = 1;
    this.filterBlogs();
  }

  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(blog: Blog) {
    this.selectedBlog = blog;
    this.blogForm = {
      title: blog.title,
      description: blog.description,
      type: blog.type,
      pet: blog.pet,
      pdfFile: null
    };
    this.showEditModal = true;
  }

  openDeleteModal(blog: Blog) {
    this.selectedBlog = blog;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedBlog = null;
    this.resetForm();
  }

  resetForm() {
    this.blogForm = {
      title: '',
      description: '',
      type: 'PROPRIETAIRE',
      pet: 'CAT',
      pdfFile: null
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.blogForm.pdfFile = file;
    } else {
      this.showErrorMessage('Veuillez sélectionner un fichier PDF valide');
      event.target.value = '';
    }
  }

  addBlog() {
    if (!this.blogForm.title || !this.blogForm.description) {
      this.showErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    
    const formData = new FormData();
    
    const blogData = {
      title: this.blogForm.title,
      description: this.blogForm.description,
      type: this.blogForm.type,
      pet: this.blogForm.pet
    };
    
    // Create a Blob with application/json content type for the data field
    const dataBlob = new Blob([JSON.stringify(blogData)], { type: 'application/json' });
    formData.append('data', dataBlob);
    
    if (this.blogForm.pdfFile) {
      formData.append('pdf', this.blogForm.pdfFile);
    }

    this.http.post(`${this.apiUrl}/blogs/add`, formData, { withCredentials: true })
      .subscribe({
        next: () => {
          this.showSuccessMessage('Blog ajouté avec succès');
          this.closeModals();
          this.loadBlogs();
        },
        error: (error) => {
          this.showErrorMessage('Erreur lors de l\'ajout du blog');
          this.isLoading = false;
        }
      });
  }

  updateBlog() {
    if (!this.selectedBlog || !this.blogForm.title || !this.blogForm.description) {
      this.showErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    
    const formData = new FormData();
    
    const blogData = {
      title: this.blogForm.title,
      description: this.blogForm.description,
      type: this.blogForm.type,
      pet: this.blogForm.pet
    };
    
    // Create a Blob with application/json content type for the data field
    const dataBlob = new Blob([JSON.stringify(blogData)], { type: 'application/json' });
    formData.append('data', dataBlob);
    
    if (this.blogForm.pdfFile) {
      formData.append('pdf', this.blogForm.pdfFile);
    }

    this.http.put(`${this.apiUrl}/blogs/update/${this.selectedBlog.id}`, formData, { withCredentials: true })
      .subscribe({
        next: () => {
          this.showSuccessMessage('Blog modifié avec succès');
          this.closeModals();
          this.loadBlogs();
        },
        error: (error) => {
          this.showErrorMessage('Erreur lors de la modification du blog');
          this.isLoading = false;
        }
      });
  }

  deleteBlog() {
    if (!this.selectedBlog) return;

    this.isLoading = true;

    this.http.delete(`${this.apiUrl}/blogs/delete/${this.selectedBlog.id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.showSuccessMessage('Blog supprimé avec succès');
          this.closeModals();
          this.loadBlogs();
        },
        error: (error) => {
          this.showErrorMessage('Erreur lors de la suppression du blog');
          this.isLoading = false;
        }
      });
  }

  showSuccessMessage(message: string) {
    this.notification = {
      show: true,
      message,
      type: 'success'
    };
    setTimeout(() => this.closeNotification(), 3000);
  }

  showErrorMessage(message: string) {
    this.notification = {
      show: true,
      message,
      type: 'error'
    };
    setTimeout(() => this.closeNotification(), 3000);
  }

  closeNotification() {
    this.notification.show = false;
  }

  getPaginatedBlogs(): Blog[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBlogs.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredBlogs.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getTypeLabel(type: string): string {
    return type === 'VETERINAIRE' ? 'Vétérinaire' : 'Propriétaire';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'VETERINAIRE' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  }
  
  getVeterinaireCount(): number {
    return this.blogs.filter(b => b.type === 'VETERINAIRE').length;
  }
  
  getProprietaireCount(): number {
    return this.blogs.filter(b => b.type === 'PROPRIETAIRE').length;
  }
  
  getCatCount(): number {
    return this.blogs.filter(b => b.pet === 'CAT').length;
  }
  
  getDogCount(): number {
    return this.blogs.filter(b => b.pet === 'DOG').length;
  }
  
  getPetLabel(pet: string): string {
    return pet === 'CAT' ? 'Chat' : 'Chien';
  }
  
  getPetBadgeClass(pet: string): string {
    return pet === 'CAT' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-pink-100 text-pink-800';
  }
}
