# Route & Dashboard Guide - Synergy World Press

This guide helps you understand and differentiate routes and dashboards according to user roles.

## Route Pattern Overview

The application uses a consistent URL pattern to identify role-specific routes:

### Base URL Structure
- **Base URL**: `http://localhost:5173` (development) or your production URL
- **Journal Base**: `/journal/jics` (JICS Journal specific routes)

---

## 🔍 How to Identify Role-Specific Routes

### Pattern Recognition

1. **Editor Routes**: Always contain `/editor/` in the path
2. **Reviewer Routes**: Always contain `/reviewer/` in the path  
3. **Author Routes**: No role prefix, or use `/submit`, `/my-submissions`

### Visual Indicators

| Role | URL Pattern | Example |
|------|------------|---------|
| **Editor** | `/journal/jics/editor/*` | `/journal/jics/editor/dashboard` |
| **Reviewer** | `/journal/jics/reviewer/*` | `/journal/jics/reviewer/dashboard` |
| **Author** | `/journal/jics/submit` or `/journal/jics/my-submissions` | `/journal/jics/submit` |

---

## 📋 Complete Route List by Role

### 1. AUTHOR/USER ROUTES

#### Authentication Routes
```
/login                    → Author login (with Google/ORCID support)
/register                 → Author registration
```

#### Main Author Routes
```
/journal/jics/submit                    → Submit manuscript (Protected - requires login)
/journal/jics/my-submissions            → View my submissions (Protected - requires login)
/profile                                → User profile (Protected - requires login)
/account                                → Account management (Protected - requires login)
```

#### Public Routes (Available to All)
```
/                                       → Landing page
/journal/jics/*                         → JICS Journal pages
/publish                               → Publishing information
/track                                 → Track research
/contactus                             → Contact page
/about                                 → About page
/team                                  → Team page
/subscriptions                         → Subscriptions
/settings                              → Settings
/termsofservice                        → Terms of service
/privacy                               → Privacy policy
```

**Key Characteristics:**
- ✅ No `/editor/` or `/reviewer/` in URL
- ✅ Uses generic `/login` and `/register`
- ✅ Dashboard is called "My Submissions" (`/my-submissions`)
- ✅ Can submit manuscripts (`/submit`)

---

### 2. EDITOR ROUTES

#### Authentication Routes
```
/journal/jics/editor/register          → Editor registration (requires specialization & experience)
/journal/jics/editor/login             → Editor login (requires access key: "EDITOR123")
```

#### Main Editor Routes
```
/journal/jics/editor/dashboard         → Editor Dashboard (Protected - requires editor role)
```

#### Information Pages
```
/journal/jics/editor                   → Editor information page (public)
```

**Key Characteristics:**
- ✅ Always contains `/editor/` in the path
- ✅ Uses separate login/register from authors
- ✅ Dashboard URL: `/journal/jics/editor/dashboard`
- ✅ Requires access key for login
- ✅ Route protection: `user?.editor?.role === "editor"`

**How to Access:**
1. Go to `/journal/jics/editor/register` to register
2. Go to `/journal/jics/editor/login` to login (need access key)
3. After login, automatically redirected to `/journal/jics/editor/dashboard`

---

### 3. REVIEWER ROUTES

#### Authentication Routes
```
/journal/jics/reviewer/register        → Reviewer registration (requires specialization & experience)
/journal/jics/reviewer/login           → Reviewer login (requires access key: "REVIEWER123")
/journal/jics/reviewer/forgot-password → Forgot password
/journal/jics/reviewer/reset-password/:token → Reset password
/reviewer/reset-password/:token       → Alternative reset password route
```

#### Main Reviewer Routes
```
/journal/jics/reviewer/dashboard       → Reviewer Dashboard (Protected - requires reviewer role)
```

#### Information Pages
```
/journal/jics/reviewer                 → Reviewer information page (public)
```

**Key Characteristics:**
- ✅ Always contains `/reviewer/` in the path
- ✅ Uses separate login/register from authors
- ✅ Dashboard URL: `/journal/jics/reviewer/dashboard`
- ✅ Has password recovery functionality
- ✅ Requires access key for login
- ✅ Route protection: `user?.reviewer?.role === "reviewer"`

**How to Access:**
1. Go to `/journal/jics/reviewer/register` to register
2. Go to `/journal/jics/reviewer/login` to login (need access key)
3. After login, automatically redirected to `/journal/jics/reviewer/dashboard`

---

## 🎯 Dashboard Comparison

### Author Dashboard (`/journal/jics/my-submissions`)
**Component**: `MySubmissions.jsx`

**Features:**
- List of submitted manuscripts
- View manuscript status
- View editor notes (only notes for authors)
- Withdraw manuscripts
- View merged PDF
- Change status from "Saved" to "Pending"

**Visual Indicators:**
- Title: "My Submissions"
- Shows only user's own manuscripts
- Status badges (Pending, Under Review, etc.)
- Cannot see reviewer notes

---

### Editor Dashboard (`/journal/jics/editor/dashboard`)
**Component**: `EditorDashboard.jsx`

**Features:**
- View ALL manuscripts (from all authors)
- Manuscript status overview with counts
- Filter by status or activity
- Update manuscript status
- Add editor notes
- Invite reviewers
- Assign reviewers
- View all notes (author, editor, reviewer)
- Bulk status updates
- Send revision requests

**Visual Indicators:**
- Title: "Editor Dashboard"
- Shows users list on left sidebar
- Status overview cards at top
- Color-coded status badges
- Action buttons for each manuscript
- Reviewer management section

**Access Control:**
- Route: `/journal/jics/editor/dashboard`
- Protection: `user?.editor?.role === "editor"`
- Redirects to login if not editor

---

### Reviewer Dashboard (`/journal/jics/reviewer/dashboard`)
**Component**: `ReviewerDashboard.jsx`

**Features:**
- View pending invitations
- Accept/reject invitations
- View assigned manuscripts
- Submit reviews with recommendations
- View editor notes (if visible to reviewers)
- View own reviewer notes only
- Cannot see author notes or other reviewers' notes

**Visual Indicators:**
- Title: "Reviewer Dashboard"
- Yellow banner for pending invitations
- Authors list on left sidebar
- Review form for each manuscript
- Recommendation dropdown (Accept, Minor Revision, Major Revision, Reject)

**Access Control:**
- Route: `/journal/jics/reviewer/dashboard`
- Protection: `user?.reviewer?.role === "reviewer"`
- Redirects to login if not reviewer

---

## 🔐 Route Protection Summary

### Public Routes (No Authentication Required)
```
/                                       → Landing page
/login                                 → Author login
/register                              → Author registration
/journal/jics/editor                   → Editor info page
/journal/jics/editor/register          → Editor registration
/journal/jics/editor/login             → Editor login
/journal/jics/reviewer                 → Reviewer info page
/journal/jics/reviewer/register        → Reviewer registration
/journal/jics/reviewer/login           → Reviewer login
/journal/jics/reviewer/forgot-password → Reviewer forgot password
```

### Protected Routes (Authentication Required)

#### Author Protected Routes
```
/journal/jics/submit          → Requires: user exists (any logged-in user)
/journal/jics/my-submissions → Requires: user exists (any logged-in user)
/profile                     → Requires: user exists
/account                     → Requires: user exists
```

#### Editor Protected Routes
```
/journal/jics/editor/dashboard → Requires: user?.editor?.role === "editor"
```

#### Reviewer Protected Routes
```
/journal/jics/reviewer/dashboard → Requires: user?.reviewer?.role === "reviewer"
```

---

## 🧭 Navigation Flow

### Author Navigation Flow
```
1. Visit /login or /register
2. Login/Register as author
3. Redirected to home or previous page
4. Access /journal/jics/submit to submit manuscript
5. Access /journal/jics/my-submissions to view submissions
```

### Editor Navigation Flow
```
1. Visit /journal/jics/editor/register
2. Register with specialization & experience
3. Visit /journal/jics/editor/login
4. Login with access key "EDITOR123"
5. Automatically redirected to /journal/jics/editor/dashboard
6. Manage manuscripts, assign reviewers, update status
```

### Reviewer Navigation Flow
```
1. Visit /journal/jics/reviewer/register
2. Register with specialization & experience
3. Visit /journal/jics/reviewer/login
4. Login with access key "REVIEWER123"
5. Automatically redirected to /journal/jics/reviewer/dashboard
6. View invitations, accept/reject, submit reviews
```

---

## 🎨 Visual Differences in Dashboards

### Editor Dashboard Visual Cues
- **Color Scheme**: Blue/Teal theme (`#496580`)
- **Layout**: 3-column grid with users list
- **Status Cards**: Color-coded status overview at top
- **Actions**: Multiple action buttons per manuscript
- **Sections**: 
  - Users with Manuscripts (left sidebar)
  - Manuscript List (center)
  - Status Overview (top)
  - Reviewer Management (dialogs)

### Reviewer Dashboard Visual Cues
- **Color Scheme**: Blue/Teal theme (`#496580`)
- **Layout**: 2-column with authors list
- **Invitations Banner**: Yellow banner for pending invitations
- **Actions**: Accept/Reject buttons, Review form
- **Sections**:
  - Pending Invitations (top, yellow banner)
  - Authors with Manuscripts (left sidebar)
  - Manuscript List (center)
  - Review Form (modal/form)

### Author Dashboard Visual Cues
- **Color Scheme**: Teal/Green theme (`#00796b`)
- **Layout**: Single column list
- **Status Badges**: Color-coded status indicators
- **Actions**: View PDF, Withdraw, View Notes
- **Sections**:
  - Manuscript List (main)
  - Status filter
  - Notes section (expandable)

---

## 🔑 Access Keys

### Editor Access Key
- **Key**: `EDITOR123`
- **Required for**: Editor login
- **Location**: `/journal/jics/editor/login`

### Reviewer Access Key
- **Key**: `REVIEWER123`
- **Required for**: Reviewer login
- **Location**: `/journal/jics/reviewer/login`

### Author Login
- **No access key required**
- **Supports**: Email/password, Google OAuth, ORCID OAuth

---

## 📍 Quick Reference: Route Patterns

### Pattern: `/journal/jics/editor/*`
**Role**: Editor
**Examples**:
- `/journal/jics/editor/register`
- `/journal/jics/editor/login`
- `/journal/jics/editor/dashboard`

### Pattern: `/journal/jics/reviewer/*`
**Role**: Reviewer
**Examples**:
- `/journal/jics/reviewer/register`
- `/journal/jics/reviewer/login`
- `/journal/jics/reviewer/dashboard`
- `/journal/jics/reviewer/forgot-password`

### Pattern: `/journal/jics/submit` or `/journal/jics/my-submissions`
**Role**: Author
**Examples**:
- `/journal/jics/submit`
- `/journal/jics/my-submissions`

### Pattern: `/login` or `/register` (no role prefix)
**Role**: Author (default)
**Examples**:
- `/login`
- `/register`

---

## 🛡️ Route Protection Logic

### How Routes Are Protected

Routes are protected in `App.jsx` using conditional rendering:

```javascript
// Editor Dashboard Protection
<Route
  path={`${JICS_URL}/editor/dashboard`}
  element={
    user?.editor?.role === "editor" ? (
      <EditorDashboard />
    ) : (
      <Navigate to={`${JICS_URL}/editor/login`} replace />
    )
  }
/>

// Reviewer Dashboard Protection
<Route
  path={`${JICS_URL}/reviewer/dashboard`}
  element={
    user?.reviewer?.role === "reviewer" ? (
      <ReviewerDashboard />
    ) : (
      <Navigate to={`${JICS_URL}/reviewer/login`} replace />
    )
  }
/>

// Author Routes Protection
<Route
  path={`${JICS_URL}/submit`}
  element={
    user ? (
      <ManuscriptPage />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
```

---

## 🧪 Testing Routes

### Test Editor Access
1. Navigate to: `/journal/jics/editor/login`
2. Enter editor credentials + access key `EDITOR123`
3. Should redirect to: `/journal/jics/editor/dashboard`
4. Try accessing without login: Should redirect to login page

### Test Reviewer Access
1. Navigate to: `/journal/jics/reviewer/login`
2. Enter reviewer credentials + access key `REVIEWER123`
3. Should redirect to: `/journal/jics/reviewer/dashboard`
4. Try accessing without login: Should redirect to login page

### Test Author Access
1. Navigate to: `/login`
2. Login as author
3. Access: `/journal/jics/submit` or `/journal/jics/my-submissions`
4. Try accessing editor/reviewer dashboards: Should redirect to respective login pages

---

## 📝 Summary Table

| Route Type | Pattern | Role | Access Key | Dashboard URL |
|-----------|---------|------|------------|---------------|
| **Author Login** | `/login` | Author | None | N/A |
| **Author Register** | `/register` | Author | None | N/A |
| **Author Submit** | `/journal/jics/submit` | Author | None | N/A |
| **Author Dashboard** | `/journal/jics/my-submissions` | Author | None | `/journal/jics/my-submissions` |
| **Editor Register** | `/journal/jics/editor/register` | Editor | None | N/A |
| **Editor Login** | `/journal/jics/editor/login` | Editor | `EDITOR123` | N/A |
| **Editor Dashboard** | `/journal/jics/editor/dashboard` | Editor | None | `/journal/jics/editor/dashboard` |
| **Reviewer Register** | `/journal/jics/reviewer/register` | Reviewer | None | N/A |
| **Reviewer Login** | `/journal/jics/reviewer/login` | Reviewer | `REVIEWER123` | N/A |
| **Reviewer Dashboard** | `/journal/jics/reviewer/dashboard` | Reviewer | None | `/journal/jics/reviewer/dashboard` |

---

## 💡 Tips for Identifying Routes

1. **Check the URL path**: Look for `/editor/` or `/reviewer/` in the URL
2. **Check the component name**: 
   - `EditorDashboard` = Editor route
   - `ReviewerDashboard` = Reviewer route
   - `MySubmissions` = Author route
3. **Check route protection**: Look for `user?.editor?.role` or `user?.reviewer?.role` checks
4. **Check login pages**: Separate login pages indicate separate roles
5. **Check access keys**: If route requires access key, it's editor or reviewer

---

*Last Updated: Based on current codebase analysis*
*Version: 1.0*


