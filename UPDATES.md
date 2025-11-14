# Synergy World Press - Recent Updates

This document outlines the recent changes and enhancements made to the Synergy World Press application.

## Table of Contents
1. [Authentication System Updates](#authentication-system-updates)
2. [Manuscript Management](#manuscript-management)
3. [Reviewer Dashboard Fixes](#reviewer-dashboard-fixes)
4. [Navigation Enhancements](#navigation-enhancements)
5. [Bug Fixes](#bug-fixes)

## Authentication System Updates

### Unified Login System
- Implemented a unified authentication system that works across multiple user roles (Author, Reviewer, Editor)
- Modified JWT token generation to be role-agnostic, using only user ID
- Updated authentication middleware to check all user types (User, Editor, Reviewer) during token verification
- Added role-based redirection after login

### Session Management
- Added session expiration handling in the frontend
- Implemented automatic redirect to login page on 401 Unauthorized responses
- Added user feedback for session timeouts

## Manuscript Management

### Type Validation
- Updated Manuscript model to support additional document types:
  - Research Article
  - Review Article
  - Manuscript (default)
- Added backward compatibility for existing manuscripts with different type values

### Submission Flow
- Enhanced manuscript submission form with proper validation
- Added support for file uploads with progress tracking
- Implemented submission confirmation and status tracking

## Reviewer Dashboard Fixes

### Review Management
- Fixed duplicate review display issue in the "Your Previous Reviews" section
- Modified client-side state management to prevent duplicate entries
- Ensured consistent review display across page refreshes

### Review Submission
- Streamlined review submission process
- Added validation for required review fields
- Improved error handling and user feedback

## Navigation Enhancements

### User Menu
- Added "My Submissions" link to the user dropdown menu
- Improved menu organization and visual hierarchy
- Added role-based menu items

### Dashboard Navigation
- Implemented role-based dashboard redirection
- Added quick access to relevant sections based on user role
- Improved mobile responsiveness of navigation elements

## Bug Fixes

### Authentication
- Fixed session expiration handling in the Editor Dashboard
- Resolved issues with role-based access control
- Fixed token validation edge cases

### Data Validation
- Added input sanitization for user-submitted content
- Fixed validation for required fields in forms
- Improved error messages for better user guidance

### Performance
- Optimized database queries for better performance
- Reduced unnecessary re-renders in React components
- Improved loading states for better user experience

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Configuration
1. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```

### Running the Application
1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Contributing

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Commit your changes with descriptive messages
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
