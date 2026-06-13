# 🎓 Campus Buddy..

**A centralized, real-time campus platform for MIT Academy of Engineering**

Built with: **Next.js 15 · TypeScript · Tailwind CSS · Supabase**

---

## ✨ Features

| Module                   | Features                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Auth & RBAC**          | PRN email validation, 4-tier roles: **Student, Professor, CR, and Admin**.                        |
| **Integrated Dashboard** | Compact overview with personalized greetings, quick stats, and relevant channels.                 |
| **Real-time Channels**   | Discord-style unified sidebar, strict academic year filtering, private rooms, and file sharing.   |
| **Advanced Chat**        | **Jump to Message** for pins/replies, emoji reactions, and modern bubble alignment.               |
| **User Profiles**        | Custom **Profile Picture** uploads, verified identities for students, and role-based permissions. |
| **Academics Hub**        | Integrated links to **PYQs** and **Notes** portals, plus module-based Courses.                    |
| **Events & Clubs**       | Campus-wide event calendar with RSVP and comprehensive Club directories.                          |
| **Admin Controls**       | Manage users, assign roles, create private channels, and manage student memberships.              |

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

In **Supabase Dashboard → SQL Editor**, run the contents of:

1. `database/schema.sql` (Base tables and RLS)
2. `database/storage_setup.sql` (Storage buckets and permissions)
3. `database/realtime_fix.sql` (Enhanced deletion sync)

### 5. Create Dummy Data (Optional)

```bash
node scripts/seed_users.mjs
```

---

## 🏗️ Project Structure

```
campus-buddy/
├── frontend/                  # Next.js app and UI
│   ├── app/(dashboard)/       # All protected pages (Dashboard, Admin, Chat)
│   ├── components/
│   │   ├── channels/chat/     # Modularized chat components (MessageList, Polls, etc.)
│   │   └── layout/            # Sidebar (Integrated navigation), Navbar
│   ├── hooks/                 # useUser, useMessages (Realtime), useNotifications
│   └── types/                 # Unified TypeScript interfaces
├── backend/                   # Data layer & Business logic
│   ├── lib/
│   │   ├── chat-utils.ts      # Heavy lifting for chat filtering & processing
│   │   └── validations.ts     # PRN email + form validation
│   └── services/              # Supabase data access layer
├── database/                  # SQL Migrations & Final Schema
└── scripts/                   # Seeding and maintenance scripts
```

---

## 🔐 Security & Access Control

- **Year-Based Isolation**: Students only see channels matching their PRN year (1-4).
- **Private Rooms**: Admins can create private channels and explicitly add specific students.
- **Elevated Roles**: Professors and CRs can manage messages, create events, and moderate content.
- **Real-time Sync**: Full `REPLICA IDENTITY` ensures deletions and updates sync instantly across all clients.

---

## 🧪 Test Accounts

All accounts use the password: `password123`

| Role             | Email                       | Password      |
| ---------------- | --------------------------- | ------------- |
| **Admin**        | `300000000001@mitaoe.ac.in` | `password123` |
| **Professor**    | `200000000001@mitaoe.ac.in` | `password123` |
| **CR**           | `100000000004@mitaoe.ac.in` | `password123` |
| **Student (Y2)** | `100000000001@mitaoe.ac.in` | `password123` |
| **Student (Y3)** | `100000000002@mitaoe.ac.in` | `password123` |
| **Student (Y1)** | `100000000003@mitaoe.ac.in` | `password123` |

_You can generate these accounts automatically using `node scripts/seed_users.mjs`._

---

## 🚢 Deploy

This project is optimized for **Vercel**.

1. Push to GitHub.
2. Connect repository to Vercel.
3. Add Environment Variables.
4. Update Supabase Auth URLs to your production domain.
yo
