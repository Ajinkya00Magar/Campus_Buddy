# Archived migrations (superseded)

These incremental patch scripts were folded into the single authoritative
[`../schema.sql`](../schema.sql) (v3.0), which is now idempotent and safe to
re-run. They are kept only for historical reference — **do not run them against
a v3 database**, as some contain stale role names (`teacher`) and duplicate
policies that predate the consolidation.

To (re)initialize the database, run `database/schema.sql` in the Supabase SQL Editor.
