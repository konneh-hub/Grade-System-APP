# Slughub

Slughub is the academic portal for managing results, assignments, students, and administrative workflows.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Database Setup

Initialize and seed the database:

```bash
npm run db:init     # Create database schema
npm run db:seed     # Seed test data
```

### Running the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser to view the app.

## Test Credentials

After running the seed script, use these test credentials:

- **Admin**: `admin@slughub.local` / `admin123`
- **Student**: `student@slughub.local` / `student123`

## App Branding

This project uses `public/slughub.jpeg` as the application logo and icon.

## Notes

Edit the source files under `app/` to customize routes and page content.
