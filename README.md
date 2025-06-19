# SBart Authentication & Database System

A comprehensive authentication and database system for the SBart skill bartering platform using **Supabase Authentication** with **MongoDB** for application data storage.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │    Supabase     │    │    MongoDB      │
│                 │    │                 │    │                 │
│  - UI Components│◄──►│  - Auth Service │    │ - User Profiles │
│  - API Routes   │    │  - User Sessions│    │ - Skills Data   │
│  - Middleware   │    │  - OAuth        │    │ - Exchanges     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Bridge System  │
                    │                 │
                    │ - useUser Hook  │
                    │ - Sync API      │
                    │ - Middleware    │
                    └─────────────────┘
```

## 📁 Project Directory Structure

```
app/
├── api/
│   ├── user/sync/route.js          # MongoDB sync endpoint
│   └── skills/route.js             # Skills CRUD operations
├── auth/
│   ├── page.jsx                    # Unified auth page (signin/signup tabs)
│   └── callback/route.js           # OAuth redirect handler
├── ui/
│   └── navbar.jsx                  # Dynamic navbar with auth states
├── layout.jsx                      # Root layout with providers
└── middleware.js                   # Route protection guard

lib/
├── supabase/
│   ├── client.js                   # Browser-side Supabase client
│   └── server.js                   # Server-side Supabase client
└── mongodb.js                      # MongoDB connection utility

models/
├── User.js                         # MongoDB user schema
├── Skill.js                        # Skills collection schema
└── Exchange.js                     # Exchanges collection schema

hooks/
└── use-user.js                     # Authentication state manager

components/
└── ui/
    ├── logo.jsx                    # SBart logo component
    └── ThemeToggleButton.jsx       # Dark mode toggle
```

## 🔄 Authentication Data Flow

### User Registration Journey
```
User fills form (/auth) → 
Supabase creates account → 
useUser hook detects signin → 
Calls /api/user/sync → 
Creates MongoDB user record → 
Redirects to /dashboard
```

### Session Management Flow
```
Page load → 
middleware.js runs → 
Checks Supabase session → 
Allows/blocks route access → 
useUser hook provides state → 
Components render accordingly
```

### Database Synchronization
```
Supabase User (ID: abc123) ←→ MongoDB User (supabaseId: abc123)
                                     ↓
                              Skills (ownerSupabaseId: abc123)
                                     ↓
                              Exchanges (requester: abc123)
```

## 🎯 Information Flow Architecture

### Client-Side State Management
- **useUser Hook**: Central authentication state broadcaster
  - Monitors Supabase auth changes
  - Automatically triggers MongoDB sync
  - Provides user data to all components
  - Handles loading states across the app

### Server-Side Protection
- **middleware.js**: First line of defense
  - Runs before every page load
  - Checks authentication at server level
  - Redirects unauthorized users
  - Prevents page flash issues

### API Route Security
- **Route Protection Pattern**: Every API endpoint follows same flow
  - Extract Supabase session from cookies
  - Verify user authentication
  - Find corresponding MongoDB user
  - Execute protected operation

## 🔗 Database Integration Strategy

### Supabase (Authentication Layer)
**Location**: External service
**Stores**: 
- User credentials (email, encrypted password)
- OAuth tokens (Google authentication)
- Session data (login state, refresh tokens)
- User metadata (name, avatar from OAuth)

### MongoDB (Application Layer)
**Location**: `models/` directory schemas
**Collections**:
- **Users**: Extended profiles linked via `supabaseId`
- **Skills**: User skills with `ownerSupabaseId` reference
- **Exchanges**: Trading records between users

### Bridge System Implementation
**Key Files**:
- `hooks/use-user.js`: Detects auth changes, triggers sync
- `app/api/user/sync/route.js`: Creates/updates MongoDB records
- `lib/supabase/server.js`: Server-side authentication verification

## 🛡️ Security Layer Implementation

### Three-Tier Protection
1. **Client-Side (`useUser` hook)**:
   - Manages UI authentication states
   - Hides/shows components based on auth
   - Provides user data to components

2. **Route-Level (`middleware.js`)**:
   - Server-side route protection
   - Runs before page components load
   - Handles redirects for unauthorized access

3. **API-Level (route handlers)**:
   - Verifies Supabase sessions
   - Links to MongoDB user records
   - Protects data operations

### Protected Route Configuration
**Protected Paths**: `/dashboard`, `/my-skills`, `/exchanges`
**Public Paths**: `/`, `/browse`, `/about`
**Auth Paths**: `/auth` (redirects if already logged in)

## 🎨 User Interface Integration

### Navbar Dynamic States
**File**: `app/ui/navbar.jsx`
**Behavior**:
- **Loading**: Shows skeleton while checking auth
- **Authenticated**: Profile dropdown with user info
- **Unauthenticated**: Single "Log In" button
- **Mobile**: Collapsible menu with auth options

### Authentication Page Design
**File**: `app/auth/page.jsx`
**Features**:
- Tab-based interface (Sign In / Sign Up)
- Google OAuth with colorful logo
- Form validation and error handling
- Parrot green accent colors
- Responsive design for all devices

## 🔄 Real-Time State Synchronization

### Authentication State Broadcasting
```
Supabase auth change → 
useUser hook detects → 
Updates React state → 
All components re-render → 
UI reflects new auth state
```

### Cross-Component Communication
- **Navbar**: Shows user profile or login button
- **Protected Pages**: Render content or redirect
- **API Calls**: Include authentication headers
- **Theme System**: Persists user preferences

## 🚀 System Workflow Examples

### New User Registration
1. User visits `/auth` page
2. Fills signup form with name, email, password
3. Form submits to Supabase authentication
4. Supabase creates user account (ID: xyz789)
5. `useUser` hook detects new authentication
6. Hook automatically calls `/api/user/sync`
7. API creates MongoDB user with `supabaseId: xyz789`
8. User redirected to `/dashboard`
9. Navbar shows user profile dropdown

### Existing User Login
1. User visits any page, middleware checks auth
2. Not authenticated, redirected to `/auth`
3. User signs in with existing credentials
4. Supabase validates and creates session
5. `useUser` hook updates app state
6. MongoDB sync ensures user record exists
7. User gains access to protected routes
8. UI updates to show authenticated state

### Creating User Content (Skills)
1. Authenticated user visits `/my-skills`
2. Middleware allows access (user is authenticated)
3. User creates new skill via form
4. Form submits to `/api/skills` POST endpoint
5. API verifies Supabase session
6. API finds MongoDB user via `supabaseId`
7. Creates skill record linked to user
8. Updates user's skills array
9. UI refreshes to show new skill

## 🔧 Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side operations
- `MONGODB_URI`: Database connection string

### Configuration Files
- `.env.local`: Environment variables
- `tailwind.config.js`: Custom parrot green color
- `next.config.js`: Build optimizations
- `middleware.js`: Route matching patterns

## 🎯 System Benefits in Practice

### For Development
- **Single Source of Truth**: `useUser` hook manages all auth state
- **Automatic Sync**: No manual user management between databases
- **Type Safety**: MongoDB schemas define data structure
- **Error Handling**: Comprehensive error states throughout

### For Users
- **Seamless Experience**: No page flashes or loading delays
- **Persistent Sessions**: Stay logged in across browser sessions
- **Multiple Auth Options**: Email/password or Google OAuth
- **Responsive Design**: Works on all devices

### For Security
- **Server-Side Protection**: Middleware runs before client code
- **Session Validation**: Every API call verifies authentication
- **Route Protection**: Unauthorized users can't access protected content
- **Data Isolation**: Users only see/modify their own data

This architecture provides a robust foundation where Supabase handles the complex authentication logic while MongoDB stores rich application data, all connected through a seamless bridge system that keeps everything synchronized automatically.