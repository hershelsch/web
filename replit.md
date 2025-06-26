# Web Content Extractor

## Overview

This is a full-stack web application that allows users to extract and download web content in three main ways:

1. **Google Search Screenshots** - Capture screenshots and HTML of Google search results
2. **Webpage Capture** - Take screenshots and download HTML of any webpage
3. **Video Downloads** - Download videos from supported URLs

The application is built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Web Scraping**: Puppeteer for browser automation
- **File Processing**: Archiver for creating ZIP files
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Tables**:
  - `jobs`: Tracks processing jobs with status, input parameters, and output paths
  - `users`: User authentication (legacy schema maintained for compatibility)

## Key Components

### Job Processing System
The application uses an asynchronous job queue system where:
- Jobs are created with `pending` status
- Background processes update status to `processing` → `completed`/`failed`
- Results are packaged as ZIP files for download
- Frontend polls job status until completion

### Web Scraping Services
- **ScraperService**: Handles Google search capture and general webpage screenshots using Puppeteer
- **VideoDownloaderService**: Downloads videos from URLs with basic HTTP handling and redirect support

### Storage Layer
- **IStorage Interface**: Abstraction for data persistence operations
- **MemStorage**: In-memory implementation for development/testing
- Database operations for job lifecycle management

## Data Flow

1. **User Interaction**: User submits a request through one of three main interfaces
2. **Job Creation**: Backend creates a job record in the database with `pending` status
3. **Background Processing**: Appropriate service processes the request asynchronously
4. **Status Updates**: Job status is updated throughout processing lifecycle
5. **Result Packaging**: Completed results are archived into ZIP files
6. **Client Polling**: Frontend polls job status and provides download links when ready

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **puppeteer**: Headless Chrome automation for web scraping
- **drizzle-orm**: Type-safe database ORM
- **archiver**: ZIP file creation
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Development Server**: Vite dev server with HMR
- **Process Manager**: tsx for TypeScript execution

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `npm run db:push`
- **Deployment**: Configured for Replit autoscale deployment

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Port 5000 for local development, mapped to port 80 for external access

## Changelog

```
Changelog:
- June 24, 2025. Converted entire backend from TypeScript to pure JavaScript/Node.js as requested
- June 24, 2025. Created single-file JavaScript application with all three extraction features
- June 24, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```