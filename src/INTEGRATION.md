# VindexRL Admin Layout — Integration Guide

## 1. Install React Router
```bash
npm install react-router-dom
```

## 2. Folder structure
Copy the downloaded files into your existing `src/` like this:

```
src/
├── App.jsx                              ← REPLACE with new App.jsx
│
├── layouts/
│   └── AdminLayout.jsx                  ← NEW
│
├── components/
│   ├── shared/
│   │   ├── Icon.jsx                     ← NEW (shared by both layouts)
│   │   └── Logo.jsx                     ← NEW (shared by both layouts)
│   ├── admin/
│   │   ├── AdminHeader.jsx              ← NEW
│   │   ├── AdminSidebar.jsx             ← NEW
│   │   └── AdminFooter.jsx              ← NEW
│   └── dashboard/                       ← your existing public components
│       └── ...
│
├── constants/
│   ├── nav.js                           ← your existing public nav
│   └── adminNav.js                      ← NEW
│
└── pages/
    └── admin/
        ├── PlaceholderAdminPage.jsx     ← NEW
        └── documents/
            ├── DocumentsPage.jsx        ← NEW
            ├── DocumentsTable.jsx       ← NEW
            ├── DocumentFilters.jsx      ← NEW
            ├── ViewModal.jsx            ← NEW
            └── mockData.js              ← NEW (replace with real API later)
```

## 3. Update App.jsx
The new `App.jsx` expects your existing public layout to be exported from `./PublicApp`.

**Rename** your current `App.jsx` → `PublicApp.jsx`, then use the new `App.jsx`.

```bash
mv src/App.jsx src/PublicApp.jsx
# then copy the new App.jsx into src/
```

## 4. Update shared components
Your existing `Icon.jsx` and `Logo.jsx` in `src/components/` can be **replaced**
with the shared versions in `components/shared/` — or keep yours and update the
import paths in the admin files to point to your existing ones.

The new `Logo.jsx` accepts a `subtitle` prop:
```jsx
<Logo subtitle="Legal Management" />  // public
<Logo subtitle="Admin Portal" />      // admin
```

## 5. Navigate between portals
- Public portal: `http://localhost:5173/`
- Admin portal:  `http://localhost:5173/admin`

The admin sidebar has a **"Public Portal"** link to go back to `/`.

To link to the admin from the public app, add anywhere:
```jsx
import { Link } from 'react-router-dom';
<Link to="/admin">Admin</Link>
```

## 6. Replace mock data with real API
Edit `src/pages/admin/documents/mockData.js` and replace the `DOCUMENTS` array
with a `useEffect` + `fetch` or your preferred data-fetching library (React Query, SWR, etc.).

## 7. Run
```bash
npm run dev
```
