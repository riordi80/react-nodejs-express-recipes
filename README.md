# Recipes React + Node.js + Express

This project is a full‑stack recipe management application that combines a REST API built with **Express** and a frontend created with **React** + **Vite**. It manages recipes, ingredients, menus, suppliers, inventory movements and user accounts with JWT authentication and role-based authorization.

## Key Features

### Core Entities
- **Dashboard**: Interactive widget-based interface with customizable components
- **Recipes**: Complete recipe management with ingredients, instructions, and metadata
- **Ingredients**: Ingredient catalog with allergen associations and pricing
- **Suppliers**: Supplier management with comprehensive ingredient relationships
- **Menus**: Menu planning and organization
- **Users**: Role-based user management (admin, chef, supplier_manager, etc.)
- **Settings**: Comprehensive settings management with role-based access control

### Advanced Functionality
- **Interactive Dashboard**: Widget-based dashboard with quick stats, recent activity, charts, and shortcuts
- **Widget Management**: Customizable widget system with drag-and-drop functionality
- **Comprehensive Settings**: Complete settings management with 6 specialized sections
- **Modern Sidebar**: Collapsible navigation with pin/unpin functionality and mobile optimization
- **Supplier-Ingredient Relationships**: Full CRUD management of supplier catalogs with pricing, delivery times, and preferred supplier settings
- **Allergen Management**: Comprehensive allergen tracking and ingredient associations
- **Smart Search**: Accent-insensitive search across all entities
- **Data Tables**: Sortable, filterable tables with pagination
- **Modal-Based UI**: Consistent modal interfaces for all CRUD operations
- **Mobile-First Design**: Optimized responsive interface for all device sizes

## Prerequisites

- Node.js and npm installed
- A MySQL database
- (Optional) Cloudflare account for tunnel setup

## Quick Start

### Backend Setup
1. `cd backend`
2. `cp .env.example .env` and configure your database credentials
3. `npm install`
4. `node app.js`

### Frontend Setup
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

The application will be available at `http://localhost:5173` with API documentation at `http://localhost:4000/docs`.

## Development Commands

### Backend (Node.js + Express)
- **Start server**: `cd backend && node app.js`
- **Install dependencies**: `cd backend && npm install`
- **API Documentation**: Available at `http://localhost:4000/docs` (Swagger UI)

### Frontend (React + Vite)
- **Development server**: `cd frontend && npm run dev` (runs on http://localhost:5173)
- **Build**: `cd frontend && npm run build`
- **Lint**: `cd frontend && npm run lint`
- **Preview build**: `cd frontend && npm run preview`
- **Install dependencies**: `cd frontend && npm install`

## Environment Configuration

This project supports both local development and Cloudflare tunnel deployment:

### Local Development
```bash
./switch-env.sh local
# Starts: localhost:5173 ↔ localhost:4000
```

### Cloudflare Tunnel
```bash
./switch-env.sh cloudflare
cloudflared tunnel run
# Enables: custom domain access with cross-domain authentication
```

Use `./switch-env.sh` to see current configuration status.

## Architecture Overview

### Full-Stack Structure
- **Backend**: Express.js REST API with MySQL database
- **Frontend**: React SPA with Vite build tool
- **Authentication**: JWT tokens stored in HTTP-only cookies with role-based authorization
- **Database**: MySQL with connection pooling via mysql2

### Backend Architecture (`/backend`)
- **Entry point**: `app.js` - Express server setup with CORS, middleware, and route configuration
- **Authentication Flow**: 
  - Auth routes (`/routes/auth.js`) handle login/logout without middleware
  - All other routes protected by `authenticateToken` + `refreshCookie` middleware
  - Rolling session management with automatic cookie refresh
- **Authorization**: Role-based access control (admin, chef) via `roleMiddleware.js`
- **Database**: MySQL connection pool configured in each route file
- **API Documentation**: Swagger YAML spec in `/docs/swagger.yaml`
- **Audit Logging**: `utils/audit.js` logs all CRUD operations

### Frontend Architecture (`/frontend/src`)
- **Entry**: `main.jsx` → `App.jsx` → `AppRoutes.jsx`
- **Routing**: React Router v6 with nested routes and private route protection
- **Authentication**: 
  - `AuthContext.jsx` provides global auth state management
  - Automatic session checking on app load via `/me` endpoint
  - Cookie-based authentication with `withCredentials: true`
- **API Layer**: Centralized Axios instance in `api/axios.js` with environment-based configuration
- **Layout System**: 
  - `MainLayout.jsx` wraps authenticated pages
  - `Sidebar.jsx` and `Topbar.jsx` for navigation
  - Protected routes nested under MainLayout
- **State Management**: React Context for auth, component-level state elsewhere

### Key Components Structure
- **Pages**: `/pages` - Main route components (Dashboard, Recipes, Allergens, Settings, etc.)
- **Components**: `/components` - Reusable UI components (Modal, RecipeCard, FilterBar, etc.)
- **Layout**: `/layout` - Layout wrapper components (MainLayout, Sidebar, Topbar)
- **Context**: `/context` - State management (AuthContext, WidgetContext)

## New Features & Enhancements

### Dashboard & Widget System
- **Interactive Dashboard**: Modern widget-based interface replacing static dashboard
- **Widget Components**: 
  - Quick Stats: Key metrics and counters
  - Recent Activity: Latest system activities and updates
  - Performance Charts: Visual data representation
  - Quick Shortcuts: Fast access to common actions
- **Widget Context**: Centralized state management for widget configuration
- **Responsive Grid**: Adaptive layout that works on all screen sizes

### Settings Management
Complete settings interface with role-based access control:

#### Settings Sections
1. **Profile Settings**: User information, preferences, and profile management
2. **Security Settings**: Password changes, two-factor authentication, security preferences
3. **Dashboard Settings**: Widget configuration, dashboard customization options
4. **User Management**: Admin-only section for managing application users
5. **Data Management**: Import/export tools, backup and restore functionality
6. **System Settings**: Application configuration, maintenance tools, system preferences

#### Features
- **Tabbed Navigation**: Clean, organized interface with intuitive section switching
- **Role-Based Access**: Sections automatically hide/show based on user permissions
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Updates**: Changes apply immediately without page refresh

### Enhanced Sidebar Navigation
- **Modern Design**: Clean, minimalist interface with smooth animations
- **Pin/Unpin Functionality**: Users can lock sidebar in expanded state
- **Mobile Optimization**:
  - Hover expansion disabled on mobile devices
  - Pin button hidden on mobile (not functional)
  - Content doesn't shift when sidebar is touched
  - Fixed width prevents interface disruption
- **Legacy Cleanup**: Removed old SidebarTemp components
- **Improved UX**: Better visual feedback and interaction patterns

### Mobile & Authentication Improvements
- **Session Persistence**: Fixed mobile authentication issues with page refresh
- **Cross-Domain Cookies**: Enhanced cookie handling for Cloudflare tunnel setup
- **Timing Optimization**: Resolved config loading race conditions
- **Error Handling**: Improved authentication error reporting and recovery
- **Mobile UX**: Touch-optimized interactions and responsive behavior

### Backend Enhancements
- **Dashboard Routes**: New API endpoints for widget data (`/routes/dashboard.js`)
- **Enhanced Auth**: Improved mobile User-Agent detection for cookie configuration
- **Better Logging**: Enhanced debugging capabilities for authentication flows
- **Route Organization**: Cleaner separation of concerns across route files

### Database & API Patterns
- All API routes follow RESTful conventions
- MySQL queries use parameterized statements for security
- Role-based endpoint protection (admin, chef access levels)
- Comprehensive filtering system for recipes (search, category, prep time, difficulty, ingredients, allergens)
- Recipe ingredients can be organized by sections
- Audit trail for all data modifications

### Environment Configuration
- Backend: Configurable via `.env` file with database credentials, JWT secret, and CORS settings
- Frontend: Environment-based API configuration with Vite
- Cross-domain cookie support for tunnel deployments
- Independent local and remote configurations

### Development Workflow
1. Configure environment: `./switch-env.sh local`
2. Start backend server: `cd backend && node app.js`
3. Start frontend dev server: `cd frontend && npm run dev`
4. Access app at http://localhost:5173
5. API docs at http://localhost:4000/docs

### Notable Patterns
- Frontend uses Material-UI components and React Icons
- Cross-domain authentication with partitioned cookies
- Environment-specific CORS configuration
- Comprehensive .gitignore for sensitive files
- Template-based environment configuration
- Spanish language used in API responses and some comments
- Database uses uppercase table names (RECIPES, USERS, etc.)

## Technical Features

### Supplier-Ingredient Relationship Management
- **Many-to-Many Relationships**: Full CRUD operations for supplier-ingredient associations via the `SUPPLIER_INGREDIENTS` table
- **Pricing & Delivery**: Track supplier-specific pricing and delivery times for each ingredient
- **Preferred Suppliers**: Mark suppliers as preferred for specific ingredients
- **Bulk Operations**: Add multiple ingredients to a supplier in a single operation
- **Real-time Updates**: Immediate synchronization of relationship changes across the interface

### Search & Filtering
- **Accent-Insensitive Search**: Uses Unicode normalization to ignore accents in search queries
- **Multi-Entity Search**: Search across recipes, ingredients, suppliers, and menus
- **Advanced Filtering**: Filter by categories, allergens, difficulty levels, and preparation times
- **Dynamic Results**: Real-time search results as you type

### Data Management
- **Sortable Tables**: Click-to-sort functionality on all table columns
- **Audit Logging**: Complete audit trail for all CRUD operations via `utils/audit.js`
- **Data Validation**: Comprehensive server-side and client-side validation
- **Error Handling**: Graceful error handling with user-friendly messages

### User Interface
- **Tabbed Modals**: Organized modal interfaces for complex data management
- **Icon-Based Actions**: Compact table actions using emoji icons
- **Responsive Design**: Mobile-first responsive layout
- **Confirmation Dialogs**: Modal-based confirmation for destructive actions

## Database Schema

### Core Tables
- `RECIPES`: Recipe management with ingredients and instructions
- `INGREDIENTS`: Ingredient catalog with allergen associations
- `SUPPLIERS`: Supplier contact information and details
- `SUPPLIER_INGREDIENTS`: Many-to-many relationship with pricing and delivery data
- `ALLERGENS`: Allergen definitions and ingredient associations
- `USERS`: User management with role-based access control
- `AUDIT_LOGS`: Comprehensive audit trail for all operations

### Key Relationships
- **Recipes ↔ Ingredients**: Many-to-many via `RECIPE_INGREDIENTS`
- **Suppliers ↔ Ingredients**: Many-to-many via `SUPPLIER_INGREDIENTS` with pricing/delivery metadata
- **Ingredients ↔ Allergens**: Many-to-many via `INGREDIENT_ALLERGENS`
- **Users ↔ Recipes**: One-to-many with audit logging

## API Endpoints

### Dashboard & Analytics
- `GET /dashboard/stats` - Get dashboard statistics and metrics
- `GET /dashboard/recent-activity` - Get recent system activity
- `GET /dashboard/charts` - Get chart data for dashboard widgets

### Authentication
- `POST /login` - User authentication with role-based access
- `POST /logout` - Secure logout with cookie cleanup
- `GET /me` - Validate session and get current user info

### Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create new supplier
- `PUT /suppliers/:id` - Update supplier information
- `DELETE /suppliers/:id` - Delete supplier

### Supplier-Ingredient Relationships
- `GET /suppliers/:id/ingredients` - Get supplier's ingredient catalog
- `POST /suppliers/:id/ingredients` - Add ingredients to supplier (bulk operation)
- `PUT /suppliers/:id/ingredients/:ingredient_id` - Update supplier-ingredient relationship
- `DELETE /suppliers/:id/ingredients/:ingredient_id` - Remove ingredient from supplier

### Ingredients
- `GET /ingredients` - List all ingredients with allergen data
- `POST /ingredients` - Create new ingredient
- `PUT /ingredients/:id` - Update ingredient
- `DELETE /ingredients/:id` - Delete ingredient

### Settings & Configuration
- User profile management endpoints
- Security settings endpoints  
- System configuration endpoints

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed