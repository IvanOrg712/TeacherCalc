# Full-Stack Project Architecture Guide

> A comprehensive reference manual for structuring scalable, maintainable full-stack applications.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Frontend Architecture](#-frontend-architecture)
3. [Backend Architecture](#️-backend-architecture)
4. [Folder Structure Reference](#-folder-structure-reference)
5. [Best Practices](#-best-practices)
6. [Quick Start Checklist](#-quick-start-checklist)

---

## Project Overview

This guide provides a standardized architecture for full-stack projects using:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + Prisma

```
project-root/
├── frontend/          # Client-side application
├── backend/           # Server-side application
└── README.md
```

---

## Frontend Architecture

> **Goal**: Clean UI, smooth interactions, and maintainable code.

The frontend handles everything the user sees and interacts with: **UI**, **UX**, and **performance**.

### 📁 Folder Structure

```
frontend/
├── node_modules/
├── src/
│   ├── @types/           # TypeScript type definitions
│   ├── api/              # API service calls & HTTP client
│   ├── assets/           # Static files (images, icons, fonts)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Screen-level views
│   ├── routes/           # App navigation & routing
│   ├── templates/        # Layout templates
│   ├── themes/           # Styling themes & design tokens
│   ├── utils/            # Helper functions & utilities
│   ├── validators/       # Form & data validations
│   ├── app.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # Vite environment types
├── .env                  # Environment variables
├── .gitignore
├── biome.json            # Linter/formatter config
├── index.html            # HTML entry point
├── package.json
├── readme.md
└── tailwind.config.ts    # TailwindCSS configuration
```

### Folder Descriptions

| Folder | Purpose | Example Files |
|--------|---------|---------------|
| `@types/` | Custom TypeScript interfaces & types | `user.d.ts`, `api.d.ts` |
| `api/` | HTTP client setup & API service functions | `httpClient.ts`, `userApi.ts` |
| `assets/` | Static resources | `logo.svg`, `icons/`, `fonts/` |
| `components/` | Reusable UI building blocks | `Button.tsx`, `Modal.tsx`, `Card.tsx` |
| `hooks/` | Custom hooks for state & logic | `useAuth.ts`, `useFetch.ts` |
| `pages/` | Full page/screen components | `HomePage.tsx`, `LoginPage.tsx` |
| `routes/` | Route definitions & guards | `AppRoutes.tsx`, `PrivateRoute.tsx` |
| `templates/` | Page layouts & wrappers | `MainLayout.tsx`, `AuthLayout.tsx` |
| `themes/` | Design system & theming | `colors.ts`, `ThemeProvider.tsx` |
| `utils/` | Helper functions | `formatDate.ts`, `storage.ts` |
| `validators/` | Validation schemas & functions | `loginSchema.ts`, `userValidator.ts` |

### Key Files

| File | Purpose |
|------|---------|
| `app.tsx` | Root component with providers & global setup |
| `main.tsx` | ReactDOM render & app initialization |
| `.env` | Environment variables (API URLs, keys) |
| `tailwind.config.ts` | TailwindCSS customization |
| `biome.json` | Code linting & formatting rules |

---

## Backend Architecture

> **Goal**: Scalable, secure, and clean APIs.

The backend handles **business logic**, **security**, and **data flow**.

### Folder Structure

```
backend/
├── node_modules/
├── prisma/               # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── @types/           # TypeScript type definitions
│   ├── config/           # Environment & app configuration
│   ├── controllers/      # Request/response handlers
│   ├── helpers/          # Utility functions
│   ├── middlewares/      # Auth, logging, error handling
│   ├── models/           # Database models & schemas
│   ├── routes/           # API endpoint definitions
│   ├── services/         # Business logic layer
│   ├── validators/       # Input validation
│   └── server.ts         # Server entry point
├── .env                  # Environment variables
├── .gitignore
├── biome.json            # Linter/formatter config
├── package.json
└── readme.md
```

### Folder Descriptions

| Folder | Purpose | Example Files |
|--------|---------|---------------|
| `prisma/` | Database ORM schema & migrations | `schema.prisma` |
| `@types/` | Custom TypeScript types | `express.d.ts`, `jwt.d.ts` |
| `config/` | App configuration & env setup | `database.ts`, `app.ts` |
| `controllers/` | Handle HTTP requests & responses | `userController.ts`, `authController.ts` |
| `helpers/` | Utility/helper functions | `hashPassword.ts`, `generateToken.ts` |
| `middlewares/` | Request pipeline interceptors | `authMiddleware.ts`, `errorHandler.ts` |
| `models/` | Data models & database schemas | `User.ts`, `Product.ts` |
| `routes/` | API route definitions | `userRoutes.ts`, `authRoutes.ts` |
| `services/` | Business logic & data operations | `userService.ts`, `emailService.ts` |
| `validators/` | Request body/param validation | `userValidator.ts`, `authValidator.ts` |

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Express app setup & server initialization |
| `schema.prisma` | Database models & relationships |
| `.env` | Secrets (DB_URL, JWT_SECRET, etc.) |

---

## Folder Structure Reference

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROJECT ROOT                             │
├─────────────────────────────┬───────────────────────────────────┤
│          FRONTEND           │            BACKEND                │
├─────────────────────────────┼───────────────────────────────────┤
│  src/                       │  src/                             │
│  ├── @types/     (types)    │  ├── @types/      (types)         │
│  ├── api/        (services) │  ├── config/      (setup)         │
│  ├── assets/     (static)   │  ├── controllers/ (handlers)      │
│  ├── components/ (UI)       │  ├── helpers/     (utilities)     │
│  ├── hooks/      (logic)    │  ├── middlewares/ (interceptors)  │
│  ├── pages/      (views)    │  ├── models/      (data)          │
│  ├── routes/     (nav)      │  ├── routes/      (endpoints)     │
│  ├── templates/  (layouts)  │  ├── services/    (business)      │
│  ├── themes/     (styles)   │  ├── validators/  (validation)    │
│  ├── utils/      (helpers)  │  └── server.ts    (entry)         │
│  ├── validators/ (forms)    │                                   │
│  ├── app.tsx     (root)     │  prisma/                          │
│  └── main.tsx    (entry)    │  └── schema.prisma (database)     │
└─────────────────────────────┴───────────────────────────────────┘
```

---

## Best Practices

### Frontend

1. **Component Organization**
   ```
   components/
   ├── common/          # Shared components (Button, Input, Modal)
   ├── features/        # Feature-specific components
   └── layout/          # Layout components (Header, Footer, Sidebar)
   ```

2. **Naming Conventions**
   - Components: `PascalCase.tsx` → `UserCard.tsx`
   - Hooks: `camelCase` with `use` prefix → `useAuth.ts`
   - Utils: `camelCase.ts` → `formatDate.ts`
   - Types: `PascalCase` → `interface UserData {}`

3. **State Management**
   - Local state: `useState`, `useReducer`
   - Global state: Context API, Zustand, or Redux
   - Server state: TanStack Query (React Query)

4. **API Calls**
   - Centralize in `api/` folder
   - Use a configured HTTP client (Axios/Fetch)
   - Handle errors consistently

### Backend

1. **Request Flow**
   ```
   Route → Middleware → Controller → Service → Model → Database
   ```

2. **Naming Conventions**
   - Controllers: `entityController.ts` → `userController.ts`
   - Services: `entityService.ts` → `userService.ts`
   - Routes: `entityRoutes.ts` → `userRoutes.ts`

3. **Error Handling**
   - Use a global error handler middleware
   - Create custom error classes
   - Return consistent error responses

4. **Security**
   - Validate all inputs (validators/)
   - Use authentication middleware
   - Sanitize data before database operations
   - Implement rate limiting

5. **Environment Variables**
   ```env
   # .env example
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   JWT_EXPIRES_IN="7d"
   ```

---

## Quick Start Checklist

### New Project Setup

- [ ] Initialize frontend with Vite + React + TypeScript
- [ ] Initialize backend with Node.js + Express + TypeScript
- [ ] Set up Prisma for database ORM
- [ ] Configure TailwindCSS for styling
- [ ] Set up Biome (or ESLint + Prettier) for linting
- [ ] Create folder structure as outlined above
- [ ] Configure environment variables (.env)
- [ ] Set up Git with proper .gitignore

### Frontend Checklist

- [ ] Create `@types/` with shared interfaces
- [ ] Set up `api/` with HTTP client
- [ ] Build reusable `components/`
- [ ] Implement `hooks/` for shared logic
- [ ] Define `routes/` with React Router
- [ ] Create `pages/` for each view
- [ ] Add `validators/` for form validation
- [ ] Configure `themes/` and TailwindCSS

### Backend Checklist

- [ ] Define database schema in `prisma/schema.prisma`
- [ ] Create `config/` for environment setup
- [ ] Build `controllers/` for each resource
- [ ] Implement `services/` for business logic
- [ ] Define `routes/` for API endpoints
- [ ] Add `middlewares/` (auth, error handling)
- [ ] Create `validators/` for input validation
- [ ] Set up `server.ts` entry point

---

## Recommended Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 18+ with TypeScript |
| **Build Tool** | Vite |
| **Styling** | TailwindCSS |
| **State Management** | Zustand / TanStack Query |
| **Routing** | React Router v6 |
| **Form Handling** | React Hook Form + Zod |
| **Backend Runtime** | Node.js |
| **Backend Framework** | Express.js |
| **Database ORM** | Prisma |
| **Database** | PostgreSQL / MySQL |
| **Authentication** | JWT + bcrypt |
| **Validation** | Zod |
| **Linting/Formatting** | Biome / ESLint + Prettier |

---

## Example Commands

```bash
# Frontend setup
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
npm install prisma @prisma/client
npx prisma init
npx tsc --init
```

---

> **Note**: This architecture is flexible. Adapt it to your project's specific needs while maintaining the separation of concerns principle.

---

*Last updated: January 2026*
