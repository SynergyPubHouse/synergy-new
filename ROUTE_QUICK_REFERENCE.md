# Route Quick Reference Card

## 🎯 Quick Identification Guide

### By URL Pattern

```
AUTHOR ROUTES:
├── /login                          → Author login
├── /register                       → Author registration  
├── /journal/jics/submit            → Submit manuscript
└── /journal/jics/my-submissions    → Author dashboard

EDITOR ROUTES:
├── /journal/jics/editor/register   → Editor registration
├── /journal/jics/editor/login      → Editor login (key: EDITOR123)
└── /journal/jics/editor/dashboard  → Editor dashboard ⭐

REVIEWER ROUTES:
├── /journal/jics/reviewer/register → Reviewer registration
├── /journal/jics/reviewer/login    → Reviewer login (key: REVIEWER123)
└── /journal/jics/reviewer/dashboard → Reviewer dashboard ⭐
```

---

## 🔍 How to Tell Which Dashboard You're On

### Editor Dashboard
- **URL**: Contains `/editor/dashboard`
- **Title**: "Editor Dashboard"
- **Features**: 
  - ✅ See ALL manuscripts from all authors
  - ✅ Users list on left sidebar
  - ✅ Status overview cards at top
  - ✅ Can invite/assign reviewers
  - ✅ Can change manuscript status
  - ✅ Can see all notes (author, editor, reviewer)

### Reviewer Dashboard
- **URL**: Contains `/reviewer/dashboard`
- **Title**: "Reviewer Dashboard"
- **Features**:
  - ✅ Yellow banner for pending invitations
  - ✅ Authors list on left sidebar
  - ✅ Only see assigned manuscripts
  - ✅ Can accept/reject invitations
  - ✅ Can submit reviews
  - ✅ Cannot see author notes
  - ✅ Cannot see other reviewers' notes

### Author Dashboard (My Submissions)
- **URL**: Contains `/my-submissions`
- **Title**: "My Submissions" or similar
- **Features**:
  - ✅ Only see YOUR own manuscripts
  - ✅ List view of submissions
  - ✅ Can withdraw manuscripts
  - ✅ Can view editor notes (only notes for authors)
  - ✅ Cannot see reviewer notes
  - ✅ Cannot change status (except Saved → Pending)

---

## 🚪 Login Page Differences

### Author Login (`/login`)
- Multiple login buttons (Author, Reviewer, Editor, Publisher)
- Google OAuth button
- ORCID OAuth button
- No access key required
- Generic login for authors

### Editor Login (`/journal/jics/editor/login`)
- **Access Key Field**: Required (EDITOR123)
- Email + Password + Access Key
- Only for editors
- Separate from author login

### Reviewer Login (`/journal/jics/reviewer/login`)
- **Access Key Field**: Required (REVIEWER123)
- Email + Password + Access Key
- Forgot password link
- Only for reviewers
- Separate from author login

---

## 📊 Dashboard Feature Comparison

| Feature | Author | Editor | Reviewer |
|---------|--------|--------|----------|
| **View Own Manuscripts** | ✅ | ❌ | ❌ |
| **View All Manuscripts** | ❌ | ✅ | ❌ |
| **View Assigned Manuscripts** | ❌ | ❌ | ✅ |
| **Submit Manuscript** | ✅ | ❌ | ❌ |
| **Change Status** | ❌ | ✅ | ❌ |
| **Invite Reviewers** | ❌ | ✅ | ❌ |
| **Accept/Reject Invitations** | ❌ | ❌ | ✅ |
| **Submit Review** | ❌ | ❌ | ✅ |
| **View Reviewer Notes** | ❌ | ✅ | ✅ (own only) |
| **View Author Notes** | ✅ | ✅ | ❌ |
| **Withdraw Manuscript** | ✅ | ❌ | ❌ |

---

## 🔐 Access Requirements

### To Access Editor Dashboard:
1. Must be registered as editor
2. Must login at `/journal/jics/editor/login`
3. Must provide access key: `EDITOR123`
4. User object must have: `user.editor.role === "editor"`

### To Access Reviewer Dashboard:
1. Must be registered as reviewer
2. Must login at `/journal/jics/reviewer/login`
3. Must provide access key: `REVIEWER123`
4. User object must have: `user.reviewer.role === "reviewer"`

### To Access Author Pages:
1. Must be registered as author (or use Google/ORCID)
2. Must login at `/login`
3. User object must exist: `user !== null`

---

## 🎨 Visual Cues in URLs

```
✅ EDITOR ROUTE:    /journal/jics/editor/*
✅ REVIEWER ROUTE:  /journal/jics/reviewer/*
✅ AUTHOR ROUTE:    /journal/jics/submit OR /journal/jics/my-submissions
```

---

## 🧭 Navigation Flow Diagram

```
AUTHOR FLOW:
/login → /journal/jics/submit → /journal/jics/my-submissions

EDITOR FLOW:
/journal/jics/editor/login → /journal/jics/editor/dashboard

REVIEWER FLOW:
/journal/jics/reviewer/login → /journal/jics/reviewer/dashboard
```

---

## 💡 Quick Tips

1. **If URL has `/editor/`** → It's an editor route
2. **If URL has `/reviewer/`** → It's a reviewer route
3. **If URL has `/submit` or `/my-submissions`** → It's an author route
4. **If login page asks for access key** → It's editor or reviewer
5. **If login page has Google/ORCID buttons** → It's author login
6. **Dashboard shows ALL manuscripts** → Editor dashboard
7. **Dashboard shows pending invitations** → Reviewer dashboard
8. **Dashboard shows only your manuscripts** → Author dashboard

---

*Quick reference for developers and users*


