# Role-Based Functionalities - Synergy World Press

This document outlines the role-based access control and functionalities available to different user types in the Synergy World Press manuscript management system.

> **📚 Related Documentation:**
> - **[ROUTE_GUIDE.md](./ROUTE_GUIDE.md)** - Complete guide to all routes and dashboards
> - **[ROUTE_QUICK_REFERENCE.md](./ROUTE_QUICK_REFERENCE.md)** - Quick reference card for route identification

## Overview

The system supports three main user roles:
1. **Author/User** - Submits and manages manuscripts
2. **Editor** - Manages the editorial workflow, assigns reviewers, and makes publication decisions
3. **Reviewer** - Reviews manuscripts and provides feedback

---

## 1. Author/User Role

Authors are users who submit manuscripts for publication. They can have two sub-roles:
- **Author** - Regular co-author
- **Corresponding Author** - Primary contact author

### Authentication & Profile
- ✅ Register new account (with title, name, email, username, password)
- ✅ Login with email/password
- ✅ Google OAuth authentication
- ✅ ORCID OAuth authentication
- ✅ View own profile
- ✅ Update profile information
- ✅ Email verification
- ✅ Password reset functionality

### Manuscript Management
- ✅ **Create Manuscript Submission**
  - Upload manuscript file (DOCX)
  - Upload cover letter (DOCX)
  - Upload declaration file (DOCX)
  - Fill manuscript metadata (title, abstract, keywords, type, classification, funding info)
  - Add multiple authors
  - Designate corresponding author
  - Automatic text extraction from manuscript
  - Automatic PDF conversion
  - Generate merged PDF with submission details table
  - Upload files to Cloudinary storage

- ✅ **Preview Manuscript**
  - Preview merged PDF before final submission
  - View submission details table

- ✅ **View My Submissions**
  - List all submitted manuscripts
  - View manuscript status
  - Access manuscript details
  - View editor notes (only notes visible to authors)
  - Cannot see reviewer notes (confidential)

- ✅ **View Manuscript Details**
  - View full manuscript information
  - View all authors and corresponding author
  - View assigned reviewers (names only)
  - View manuscript files (manuscript, cover letter, declaration, merged PDF)
  - View extracted text, title, abstract, keywords

- ✅ **Withdraw Manuscript**
  - Delete own manuscript submissions
  - Only if user is an author of the manuscript
  - Removes manuscript from all authors' lists

- ✅ **Extract Manuscript Info**
  - Upload manuscript to extract title, abstract, keywords automatically
  - Used for form auto-fill

- ✅ **View Editor Notes for Author**
  - View only `editorNotesForAuthor` (notes meant for authors)
  - Cannot see internal editor notes or reviewer notes
  - Access restricted to manuscript authors only

### Limitations
- ❌ Cannot view reviewer notes (confidential)
- ❌ Cannot view internal editor notes
- ❌ Cannot modify manuscript after submission
- ❌ Cannot change manuscript status
- ❌ Cannot assign reviewers
- ❌ Cannot access other users' manuscripts

---

## 2. Editor Role

Editors manage the entire editorial workflow, from initial screening to final publication decisions.

### Authentication & Profile
- ✅ Register as editor (requires specialization and experience)
- ✅ Login with email/password
- ✅ View editor profile
- ✅ Update editor profile
- ✅ Password management

### Manuscript Management
- ✅ **View All Manuscripts**
  - View all submitted manuscripts (excluding "Saved" and "Rejected" status)
  - Filter by author
  - View manuscript details including all notes

- ✅ **View Users with Manuscripts**
  - List all users who have submitted manuscripts
  - View each user's manuscript submissions
  - Access to full manuscript data

- ✅ **Update Manuscript Status**
  - Change status to: Pending, Under Review, Reviewed, Revision Required, Accepted, Rejected
  - Add status change notes
  - Automatic email notifications to authors on status change
  - Cannot modify rejected manuscripts (immutable)

- ✅ **Bulk Status Update**
  - Update multiple manuscripts at once
  - Apply same status and note to multiple manuscripts
  - Individual email notifications for each manuscript

### Notes & Communication
- ✅ **Add Editor Notes**
  - Add internal notes (visible to editors and reviewers)
  - Add notes for authors (visible to authors)
  - Notes include action type and visibility settings

- ✅ **View All Manuscript Notes**
  - View author notes
  - View editor notes (internal and for authors)
  - View reviewer notes
  - Complete note history with timestamps

- ✅ **Add Revision Required Notes**
  - Mark manuscript as "Revision Required"
  - Add detailed revision instructions
  - Automatic email notification to authors

### Reviewer Management
- ✅ **View All Reviewers**
  - List all registered reviewers
  - View reviewer specialization and experience
  - Search and filter reviewers

- ✅ **Invite Reviewers**
  - Send invitation emails to reviewers
  - Add editor note with invitation
  - Track invitation status (pending, accepted, rejected)
  - Invitations stored in manuscript record

- ✅ **View Accepted Invitations**
  - See which reviewers accepted invitations
  - View reviewer details for accepted invitations
  - Check if reviewers are already assigned

- ✅ **Assign Reviewers**
  - Assign reviewers from accepted invitations
  - Automatically update manuscript status to "Under Review"
  - Add manuscript to reviewer's assigned list
  - Email notification to authors when reviewers assigned

### Email Notifications
- ✅ **Automatic Status Change Emails**
  - Send email to all manuscript authors on status change
  - Include status details and editor notes
  - Formatted HTML emails with manuscript information
  - Include link to view submissions

### Limitations
- ❌ Cannot submit manuscripts as author
- ❌ Cannot review manuscripts
- ❌ Cannot modify rejected manuscripts
- ❌ Cannot delete manuscripts (only authors can withdraw)

---

## 3. Reviewer Role

Reviewers evaluate manuscripts and provide feedback to editors and authors.

### Authentication & Profile
- ✅ Register as reviewer (requires specialization and experience)
- ✅ Login with email/password
- ✅ View reviewer profile
- ✅ Forgot password functionality
- ✅ Reset password with token

### Invitation Management
- ✅ **View Pending Invitations**
  - See all manuscripts where reviewer has been invited
  - View manuscript details (title, type, abstract, keywords)
  - View editor notes (if visible to reviewers)
  - See invitation date

- ✅ **Accept Invitation**
  - Accept reviewer invitation for a manuscript
  - Automatically added to assigned reviewers
  - Manuscript added to reviewer's assigned list
  - Invitation status updated to "accepted"

- ✅ **Reject Invitation**
  - Reject reviewer invitation with reason
  - Invitation status updated to "rejected"
  - Rejection reason stored

### Review Management
- ✅ **View Assigned Manuscripts**
  - List all manuscripts assigned to reviewer
  - View manuscript details
  - View corresponding author information
  - Access manuscript PDF files
  - View editor notes (if visible to reviewers)
  - View own reviewer notes only

- ✅ **Submit Review**
  - Submit review comments
  - Provide recommendation:
    - Accept
    - Minor Revision
    - Major Revision
    - Reject
  - Review notes visible to editors and reviewers (not authors)
  - Review stored in `reviewerNotes` array
  - Manuscript status remains "Under Review" (only editors can change final status)

### Notes & Feedback
- ✅ **View Notes**
  - View own reviewer notes
  - View editor notes (if visibility includes "reviewer")
  - Cannot see author notes
  - Cannot see other reviewers' notes

### Limitations
- ❌ Cannot see author notes
- ❌ Cannot see other reviewers' notes
- ❌ Cannot change manuscript status (only editors can)
- ❌ Cannot assign other reviewers
- ❌ Cannot modify submitted reviews
- ❌ Cannot access manuscripts not assigned to them

---

## Manuscript Status Workflow

The system follows this status progression:

1. **Saved** - Initial draft, not yet submitted
2. **Pending** - Submitted, awaiting editor screening
3. **Under Review** - Assigned to reviewers, review in progress
4. **Reviewed** - Review completed, awaiting editor decision
5. **Revision Required** - Author needs to make revisions
6. **Accepted** - Manuscript accepted for publication
7. **Rejected** - Manuscript rejected (immutable status)

### Status Change Rules
- Only editors can change manuscript status
- Rejected manuscripts cannot be modified
- Status changes trigger email notifications to authors
- Reviewers cannot change status (only submit reviews)

---

## Note Visibility System

The system uses a visibility-based note system:

### Note Types
1. **Author Notes** (`authorNotes`)
   - Created by authors
   - Visible to: Authors, Editors

2. **Editor Notes** (`editorNotes`)
   - Internal editor notes
   - Visible to: Editors, Reviewers (if visibility includes "reviewer")

3. **Editor Notes for Author** (`editorNotesForAuthor`)
   - Notes meant for authors
   - Visible to: Authors, Editors
   - Used for status changes, revision requests, acceptance/rejection

4. **Reviewer Notes** (`reviewerNotes`)
   - Review comments and recommendations
   - Visible to: Editors, Reviewers (only their own notes)
   - **NOT visible to authors** (confidential)

### Visibility Rules
- Authors can only see `editorNotesForAuthor`
- Reviewers can see editor notes (if visibility includes "reviewer") and their own reviewer notes
- Editors can see all notes
- Reviewer notes are confidential and never shown to authors

---

## Authentication & Authorization

### JWT Token System
- Each role has a JWT token with role identifier
- Tokens expire after 24-30 days
- Role-based middleware enforces access control

### Access Control
- Protected routes require authentication
- Role-based access enforced at middleware level
- Users can only access their own data or data they're authorized to see

---

## File Management

### File Storage
- Files uploaded to Cloudinary
- Automatic DOCX to PDF conversion
- Merged PDF generation with submission details
- Secure file URLs with access control

### File Access
- Authors: Can access their own manuscript files
- Editors: Can access all manuscript files
- Reviewers: Can access assigned manuscript files only

---

## Email Notifications

### Automatic Notifications
- **Status Changes**: Authors receive email when manuscript status changes
- **Reviewer Invitations**: Reviewers receive invitation emails
- **Password Reset**: Users receive password reset links

### Email Content
- Formatted HTML emails
- Include manuscript details
- Include action links
- Professional branding

---

## Summary Table

| Functionality | Author | Editor | Reviewer |
|--------------|--------|--------|----------|
| Register/Login | ✅ | ✅ | ✅ |
| Submit Manuscript | ✅ | ❌ | ❌ |
| View Own Manuscripts | ✅ | ❌ | ❌ |
| View All Manuscripts | ❌ | ✅ | ❌ |
| View Assigned Manuscripts | ❌ | ❌ | ✅ |
| Change Status | ❌ | ✅ | ❌ |
| Assign Reviewers | ❌ | ✅ | ❌ |
| Invite Reviewers | ❌ | ✅ | ❌ |
| Accept/Reject Invitation | ❌ | ❌ | ✅ |
| Submit Review | ❌ | ❌ | ✅ |
| View Reviewer Notes | ❌ | ✅ | ✅ (own only) |
| View Editor Notes | ✅ (for author) | ✅ | ✅ (if visible) |
| Add Notes | ✅ (author notes) | ✅ | ✅ (review notes) |
| Withdraw Manuscript | ✅ | ❌ | ❌ |
| Email Notifications | ✅ (receive) | ✅ (send) | ✅ (receive) |

---

## Technical Implementation

### Backend Models
- `User` - Author/user model
- `Editor` - Editor model
- `Reviewer` - Reviewer model
- `Manuscript` - Manuscript model with notes arrays

### Middleware
- `auth.js` - JWT authentication and role detection
- Role-based route protection

### Controllers
- `authController.js` - User authentication
- `manuscriptController.js` - Manuscript operations
- `editorController.js` - Editor operations
- `reviewerController.js` - Reviewer operations

### Routes
- `/api/auth/*` - User authentication routes
- `/api/manuscripts/*` - Manuscript routes
- `/api/editor/*` - Editor routes
- `/api/reviewer/*` - Reviewer routes

---

## Security Considerations

1. **Role-Based Access Control**: Enforced at middleware level
2. **Note Confidentiality**: Reviewer notes never exposed to authors
3. **File Access**: Users can only access authorized files
4. **Status Immutability**: Rejected manuscripts cannot be modified
5. **JWT Security**: Tokens include role information for authorization
6. **Password Security**: Bcrypt hashing for all passwords

---

*Last Updated: Based on current codebase analysis*
*Version: 1.0*

