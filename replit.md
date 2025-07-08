# APK Builder Application

## Overview

This is a full-stack web application that allows users to upload Android source code projects and compile them into APK files. The application provides a user-friendly interface for uploading ZIP files containing Android projects, configuring build settings, monitoring build progress, and downloading the resulting APK files.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **File Handling**: Multer for file uploads with local storage
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient data fetching and caching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations with PostgreSQL
- **Multer** middleware for handling file uploads
- **Memory storage** implementation for development (with interface for easy database migration)
- **RESTful API** design with proper error handling

### Database Schema
The application uses a single main table `build_projects` that stores:
- Project metadata (name, package name, version)
- Source type information (file upload or GitHub repository)
- File information (size, path) for ZIP uploads
- GitHub repository information (URL, branch) for GitHub imports
- Build configuration (type, SDK versions, architecture)
- Build status and progress tracking
- Error handling and logging
- Timestamps for project lifecycle

## Data Flow

### File Upload Method
1. **File Upload**: User uploads ZIP file containing Android project source code
2. **Project Creation**: Server validates file and creates project record with initial metadata
3. **Build Configuration**: User selects build options (debug/release, SDK versions, architecture)
4. **Build Process**: Server processes the project (currently simulated with progress updates)
5. **Progress Monitoring**: Client polls server for build status updates
6. **Download**: Upon completion, user can download the generated APK file

### GitHub Import Method
1. **GitHub URL Input**: User provides GitHub repository URL, branch, project details
2. **Repository Validation**: Server simulates cloning and validates repository structure
3. **Project Creation**: Server creates project record with GitHub source metadata
4. **Build Configuration**: User selects build options (debug/release, SDK versions, architecture)
5. **Build Process**: Server processes the GitHub project (currently simulated)
6. **Progress Monitoring**: Client polls server for build status updates
7. **Download**: Upon completion, user can download the generated APK file

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI primitives for accessibility
- **multer**: File upload handling
- **express**: Web server framework
- **react**: Frontend framework
- **vite**: Build tool and development server

### Development Tools
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

The application is designed for deployment on platforms like Replit with the following approach:

### Development Mode
- Vite development server with HMR for frontend
- Express server with auto-reload for backend changes
- Memory storage for rapid prototyping

### Production Build
- Frontend assets built and served statically
- Backend bundled with ESBuild for optimal performance
- Database migrations handled through Drizzle Kit
- Environment-based configuration for database connections

### Environment Configuration
- Database URL configured through environment variables
- Development/production mode detection
- Replit-specific optimizations and error handling

## Changelog
- July 08, 2025: Implemented real Android compilation system
  - Added AndroidBuilder class for actual APK compilation from source code
  - Created Docker-based build environment with Android SDK and tools
  - Implemented proper APK structure generation with AndroidManifest.xml and DEX files
  - Enhanced download system to serve real APK files with proper headers
  - Updated build process to validate Android project structure before compilation
- July 08, 2025: Added GitHub repository import feature
  - Extended database schema to support both file uploads and GitHub sources
  - Added tabbed interface for choosing between ZIP file upload and GitHub import
  - Implemented GitHub URL validation and automatic project name extraction
  - Updated project information display to show source type and repository details
  - Enhanced recent builds list to display source type indicators
- July 08, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.