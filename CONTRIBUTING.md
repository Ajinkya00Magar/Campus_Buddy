# Contributing to Campus Buddy

Welcome to the Campus Buddy repository! We're thrilled that you'd like to contribute. This document outlines our development workflows, architectural standards, and team conventions to ensure a smooth collaboration experience.

---

## 🏗️ Architecture Overview

Campus Buddy is built using a modern full-stack TypeScript architecture:
- **Frontend Framework:** Next.js (App Router)
- **UI Library:** React, TailwindCSS, shadcn/ui, Lucide React icons
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management:** React Hooks, Supabase Realtime subscriptions
- **Deployment:** Vercel

---

## 🛠️ Local Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-org/campus-buddy.git
   cd campus-buddy
   ```

2. **Install Dependencies:**
   Ensure you are using Node.js 18+.
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and fill in your Supabase details.
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
   *Note: Ensure you have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` populated.*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

---

## 🗄️ Database & Schema Modifications

We use raw SQL scripts for our database schema to maintain maximum control over our Supabase PostgreSQL instance.

- **Schema Location:** `database/schema.sql`
- **Migrations:** If you modify tables, RLS policies, or realtime triggers, place the changes in a new `.sql` file inside the `database/` directory (e.g., `database/update_v3_notifications.sql`) and run them directly in your Supabase SQL Editor.
- **TypeScript Types:** If you alter the database schema, make sure to update the corresponding interfaces in `frontend/types/index.ts`.

---

## 🧑‍💻 Coding Standards

### 1. File Structure
- **UI Components:** `frontend/components/`
  - Reusable logic (like buttons, modals) goes into `frontend/components/ui/`
  - Domain-specific logic goes into domain folders (e.g., `frontend/components/channels/`)
- **Pages (App Router):** `frontend/app/`
- **Data Fetching/Services:** `backend/services/`
  - *Note:* Always import from services using the `@/services/...` alias. Do not use relative paths like `../../../backend/services`.

### 2. TypeScript and Safety
- We strictly enforce TypeScript. Use explicit typing over `any` whenever possible.
- Do not bypass the type system using `// @ts-ignore` or casting without team approval.
- Ensure all changes pass the TypeScript compiler without errors:
  ```bash
  npx tsc -p frontend/tsconfig.json --noEmit
  ```

### 3. Realtime & State
- Real-time updates should always clean up their subscription instances when a component unmounts using `useEffect` cleanup functions.
- Always use `createClient()` from `@/lib/supabase/client` or `@/lib/supabase/server` rather than initializing Supabase directly.

---

## 🌿 Git Workflow & Pull Requests

We use a feature-branch workflow. Please adhere to the following when creating Pull Requests (PRs).

1. **Branch Naming:**
   - Features: `feat/short-description` (e.g., `feat/notification-badges`)
   - Bug Fixes: `fix/short-description` (e.g., `fix/sidebar-rendering`)
   - Chores/Docs: `chore/update-readme`

2. **Commit Messages:**
   Use conventional commits:
   - `feat: add user mentions`
   - `fix: resolve crash on null avatar`
   - `docs: update contributing guidelines`

3. **Creating a Pull Request:**
   - Keep PRs small and focused on a single logical change.
   - Describe **why** you are making the change, not just **what**.
   - If your PR introduces UI changes, attach screenshots.
   - Ensure all checks (TypeScript compiler, linting) pass before requesting a review.

---

## 💬 Getting Help
If you are stuck, please drop a message in the engineering channel or tag a reviewer on your PR. We value communication over struggling silently!
