# 🐾 VITALFEED - Veterinary Nutrition Platform

A comprehensive web application for veterinary nutrition management, built with Angular 17. VITALFEED provides a complete platform for veterinarians, pet owners, and commercial partners to manage pet nutrition products and subscriptions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [User Roles](#user-roles)
- [Key Features by Role](#key-features-by-role)
- [API Integration](#api-integration)
- [Contributing](#contributing)

## ✨ Features

- **Multi-Role Authentication**: Separate spaces for veterinarians, pet owners, commercial partners, and administrators
- **Product Catalog**: Browse and manage pet nutrition products (dogs & cats)
- **Shopping Cart**: Full cart management with cookie-based authentication
- **Subscription Management**: Handle user subscriptions and access control
- **Blog System**: Educational articles and PDF resources for pet nutrition
- **Admin Dashboard**: Comprehensive admin panel for managing users, products, blogs, and more
- **Interactive Maps**: Find veterinary clinics and pet stores using Leaflet
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Image Optimization**: Lazy loading and optimized image delivery
- **PDF Viewer**: Integrated PDF viewing for educational content

## 🛠 Tech Stack

### Frontend
- **Angular 17.3** - Modern web framework
- **TypeScript 5.4** - Type-safe development
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **RxJS 7.8** - Reactive programming
- **Leaflet 1.9** - Interactive maps

### Additional Libraries
- **ng-select** - Advanced select components
- **ngx-intl-tel-input** - International phone input
- **Bootstrap 5.3** - UI components
- **Sharp** - Image optimization

### Build Tools
- **Angular CLI 17.3** - Project scaffolding and build
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
vet-app/
├── src/
│   ├── app/
│   │   ├── components/          # UI components
│   │   │   ├── admin-*/         # Admin panel components
│   │   │   ├── espace-*/        # User space components
│   │   │   ├── panier*/         # Shopping cart components
│   │   │   └── ...
│   │   ├── services/            # Business logic services
│   │   │   ├── cart.service.ts
│   │   │   ├── product.service.ts
│   │   │   └── toast.service.ts
│   │   ├── guards/              # Route guards
│   │   │   ├── auth.guard.ts
│   │   │   ├── commercial.guard.ts
│   │   │   └── matricule-validated.guard.ts
│   │   ├── directives/          # Custom directives
│   │   │   ├── infinite-scroll.directive.ts
│   │   │   └── lazy-load-image.directive.ts
│   │   ├── pipes/               # Custom pipes
│   │   │   └── safe.pipe.ts
│   │   └── models/              # TypeScript interfaces
│   ├── assets/                  # Static assets
│   │   ├── images/
│   │   └── ...
│   └── environments/            # Environment configs
├── scripts/                     # Build scripts
│   ├── optimize-images.js
│   └── compress-images.js
└── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vet-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Configure `src/environments/environment.ts` with your API URL

4. Start the development server:
```bash
npm start
```

5. Navigate to `http://localhost:4200/`

## 📜 Available Scripts

### Development
```bash
npm start              # Start dev server on http://localhost:4200
npm run watch          # Build with watch mode
```

### Build
```bash
npm run build          # Production build
npm run vercel-build   # Build for Vercel deployment
```

### Testing
```bash
npm test               # Run unit tests with Karma
```

### Image Optimization
```bash
npm run analyze:images    # Analyze image sizes
npm run compress:images   # Compress images
npm run optimize:images   # Run both analyze and compress
```

### Angular CLI
```bash
ng generate component <name>   # Generate new component
ng generate service <name>      # Generate new service
ng generate guard <name>        # Generate new guard
```

## 👥 User Roles

### 1. Pet Owners (Propriétaires)
- Browse educational articles
- Find veterinary clinics and pet stores
- Access pet nutrition information

### 2. Veterinarians (Vétérinaires)
- Access exclusive product catalog
- Manage shopping cart
- View professional resources and blogs
- Subscription-based access control

### 3. Commercial Partners
- Manage orders for veterinary clients
- Access commercial dashboard
- Handle bulk orders

### 4. Administrators
- Full system management
- User and subscription management
- Product catalog management
- Blog and content management
- Analytics dashboard

## 🎯 Key Features by Role

### Veterinarian Space (`/espace-veterinaire`)
- Product browsing with filters (dog/cat, categories)
- Shopping cart management
- Educational blog access
- Profile management
- Subscription status tracking

### Admin Panel (`/admin`)
- Dashboard with statistics
- User management
- Product CRUD operations
- Blog management
- Subscription management
- Veterinarian database management
- Clinic and store management

### Pet Owner Space (`/espace-proprietaire`)
- Educational articles
- Interactive map for finding services
- Pet nutrition guides
- Blog resources

## 🔌 API Integration

The application uses cookie-based authentication with `HttpOnly` cookies for security:

```typescript
// All API calls include withCredentials: true
this.http.get(url, { withCredentials: true })
```

### Key Endpoints
- `/api/login` - User authentication
- `/api/logout` - Session termination
- `/api/veterinaires/me` - Current user info
- `/api/products/all` - Product catalog
- `/api/cart` - Cart operations
- `/api/blogs/*` - Blog content

## 🔒 Security Features

- Cookie-based authentication with HttpOnly cookies
- Route guards for protected pages
- Role-based access control
- CSRF protection
- Secure password handling

## 🎨 Styling

The project uses Tailwind CSS for styling with custom configurations:

- Custom color palette for branding
- Responsive breakpoints
- Custom animations
- Utility-first approach

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🐛 Known Issues

- None currently reported

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development Team

Built with ❤️ for veterinary professionals and pet owners.

---

**Version**: 0.0.0  
**Angular**: 17.3.17  
**Last Updated**: 2026
