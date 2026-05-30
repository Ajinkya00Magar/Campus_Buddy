# 🎓 Campus Buddy

**A centralized campus platform for MIT Academy of Engineering**

Built with: **Next.js 15 · TypeScript · Tailwind CSS · Supabase**

---

## ✨ Features

| Module | Features |
|--------|----------|
| **Auth** | PRN email validation (`123456789012@mitaoe.ac.in`), role-based (student/professor/cr/admin) |
| **Dashboard** | Personalized greeting, quick stats, upcoming events, recent courses |
| **Events** | Browse/filter events, RSVP (going/maybe/not going), event detail with attendee list |
| **Clubs** | Club directory, join/leave, achievements, member list |
| **Courses** | Module-based learning, progress tracking, badge on completion |
| **Channels** | Real-time chat (Supabase Realtime), file upload, poll creation, pinned messages |
| **Notifications** | Real-time badge, mark read, full notifications page |
| **Admin Panel** | Manage users, events, clubs, channels, courses |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd campus-buddy
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key**

### 3. Set Environment Variables

```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Schema

In **Supabase Dashboard → SQL Editor**, paste and run the entire contents of `database/schema.sql`.

This creates all tables, RLS policies, indexes, the auto-profile trigger, and seed data.

### 5. Create Storage Buckets

In **Supabase Dashboard → Storage**, create these buckets (all public):

| Bucket | Public |
|--------|--------|
| `avatars` | ✅ |
| `event-banners` | ✅ |
| `club-assets` | ✅ |
| `course-thumbs` | ✅ |
| `channel-files` | ✅ |

### 6. Configure Auth

In **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/api/auth/callback`

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
campus-buddy/
├── frontend/                  # Next.js app and UI
│   ├── app/
│   │   ├── (auth)/login/      # Login & signup page
│   │   ├── (dashboard)/       # All protected pages
│   │   └── api/auth/callback/ # Auth callback
│   ├── components/            # Layout + shadcn-style UI primitives
│   ├── contexts/              # Sidebar state provider
│   ├── hooks/                 # useUser, useMessages, useNotifications
│   ├── types/                 # TypeScript interfaces
│   ├── middleware.ts          # Route protection
│   └── *.config.*             # Next, Tailwind, PostCSS, TypeScript config
├── backend/                   # Supabase access and app data layer
│   ├── lib/
│   │   ├── supabase/          # client.ts + server.ts
│   │   ├── utils.ts           # helpers
│   │   └── validations.ts     # PRN email + form validation
│   └── services/              # Data access layer (Supabase queries)
├── database/
│   └── schema.sql             # Full DB schema + seed data
├── package.json               # Root scripts run the frontend app
└── package-lock.json
```

---

## 🔐 Email Validation

Only emails matching this pattern are accepted:
```
123456789012@mitaoe.ac.in
└──────────┘  └─────────┘
  12-digit PRN   domain
```

---

## 🚢 Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy ✅

Update Supabase Auth URLs to your Vercel domain after deploy.

---

## 🧪 Test Accounts

After running the schema, sign up with any valid PRN email:
- `100000000001@mitaoe.ac.in` — student
- `200000000001@mitaoe.ac.in` — professor  
- `300000000001@mitaoe.ac.in` — admin
