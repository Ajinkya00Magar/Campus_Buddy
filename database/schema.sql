-- ============================================================
-- CAMPUS BUDDY — COMPLETE SUPABASE SQL SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  department  TEXT,
  year        INTEGER CHECK (year BETWEEN 1 AND 4),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE public.events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'general',
  location      TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  banner_url    TEXT,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_capacity  INTEGER,
  is_published  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_participants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- CLUBS
-- ============================================================
CREATE TABLE public.clubs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  achievements    TEXT[],
  links           JSONB DEFAULT '[]',
  faculty_advisor UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.club_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id   UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead', 'co-lead')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE public.courses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  duration     TEXT,
  level        TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  tags         TEXT[],
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  video_url   TEXT,
  order_index INTEGER NOT NULL,
  duration    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id, module_id)
);

CREATE TABLE public.course_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- CHANNELS
-- ============================================================
CREATE TABLE public.channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'academic' CHECK (type IN ('academic', 'subject', 'club', 'official')),
  department  TEXT,
  year        INTEGER,
  is_private  BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.channel_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT,
  file_url   TEXT,
  file_name  TEXT,
  is_pinned  BOOLEAN DEFAULT FALSE,
  reply_to   UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at  TIMESTAMPTZ
);

CREATE TABLE public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================================
-- POLLS
-- ============================================================
CREATE TABLE public.polls (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id    UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_idx INTEGER NOT NULL,
  voted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT DEFAULT 'info' CHECK (type IN ('message', 'event', 'course', 'info')),
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX idx_notifications_user       ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_course_progress_user     ON public.course_progress(user_id, course_id);
CREATE INDEX idx_events_date              ON public.events(event_date, is_published);
CREATE INDEX idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_club_members_club        ON public.club_members(club_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_read"   ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- EVENTS
CREATE POLICY "events_read"   ON public.events FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- EVENT_PARTICIPANTS
CREATE POLICY "rsvp_read"   ON public.event_participants FOR SELECT USING (TRUE);
CREATE POLICY "rsvp_insert" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_update" ON public.event_participants FOR UPDATE USING (auth.uid() = user_id);

-- CLUBS
CREATE POLICY "clubs_read"   ON public.clubs FOR SELECT USING (TRUE);
CREATE POLICY "clubs_manage" ON public.clubs FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "club_members_read"   ON public.club_members FOR SELECT USING (TRUE);
CREATE POLICY "club_members_insert" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club_members_delete" ON public.club_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- COURSES
CREATE POLICY "courses_read"   ON public.courses FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));
CREATE POLICY "courses_manage" ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));

CREATE POLICY "modules_read"   ON public.course_modules FOR SELECT USING (TRUE);
CREATE POLICY "modules_manage" ON public.course_modules FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));

CREATE POLICY "progress_own" ON public.course_progress    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "complete_own" ON public.course_completions FOR ALL USING (auth.uid() = user_id);

-- CHANNELS
CREATE POLICY "channels_read"   ON public.channels FOR SELECT USING (TRUE);
CREATE POLICY "channels_manage" ON public.channels FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "channel_members_read"   ON public.channel_members FOR SELECT USING (TRUE);
CREATE POLICY "channel_members_insert" ON public.channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "messages_read"   ON public.messages FOR SELECT USING (TRUE);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher')));

-- MESSAGE REACTIONS
CREATE POLICY "reactions_read"   ON public.message_reactions FOR SELECT USING (TRUE);
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_update" ON public.message_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- POLLS & VOTES
CREATE POLICY "polls_read"   ON public.polls FOR SELECT USING (TRUE);
CREATE POLICY "polls_insert" ON public.polls FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "votes_read"   ON public.poll_votes FOR SELECT USING (TRUE);
CREATE POLICY "votes_insert" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update" ON public.poll_votes FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notifs_read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifs_insert" ON public.notifications FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, department, year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'department',
    CASE WHEN NEW.raw_user_meta_data->>'year' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'year')::INTEGER
         ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- ============================================================
-- SEED DATA (optional — remove if not needed)
-- ============================================================
INSERT INTO public.channels (name, description, type, department, year) VALUES
  ('notices',        'Official campus notices',              'official',  NULL,  NULL),
  ('placements',     'Placement updates and opportunities',  'official',  NULL,  NULL),
  ('cse-2nd-year',   'CSE Second Year',                     'academic',  'CSE', 2),
  ('cse-3rd-year',   'CSE Third Year',                      'academic',  'CSE', 3),
  ('mech-2nd-year',  'Mechanical Second Year',               'academic',  'MECH',2),
  ('dsa',            'Data Structures & Algorithms',         'subject',   NULL,  NULL),
  ('os',             'Operating Systems',                    'subject',   NULL,  NULL),
  ('robotics-club',  'Robotics Club Channel',                'club',      NULL,  NULL),
  ('coding-club',    'Coding Club Channel',                  'club',      NULL,  NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.clubs (name, description, category, achievements) VALUES
  ('Robotics Club',  'Building the future, one robot at a time.', 'Technical',
   ARRAY['Winner RoboWars 2024', 'Finalist Smart India Hackathon 2023', 'Best Innovation Award 2023']),
  ('Coding Club',    'Competitive programming and open source.', 'Technical',
   ARRAY['ACM ICPC Regionals 2023', 'Google Code Jam Finalist 2024']),
  ('Cultural Club',  'Celebrating art, music and culture at MITAOE.', 'Cultural',
   ARRAY['Best Cultural Fest 2023'])
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, description, level, duration, tags) VALUES
  ('Introduction to Python',
   'Learn Python from scratch — variables, loops, functions, and OOP.',
   'beginner', '4 hours', ARRAY['python', 'programming', 'beginner']),
  ('Data Structures & Algorithms',
   'Master arrays, linked lists, trees, graphs and algorithm design.',
   'intermediate', '8 hours', ARRAY['dsa', 'algorithms', 'cs-fundamentals']),
  ('Web Development with Next.js',
   'Build full-stack web apps with Next.js, React, and Tailwind CSS.',
   'intermediate', '6 hours', ARRAY['nextjs', 'react', 'web'])
ON CONFLICT DO NOTHING;

-- Add modules for Python course
DO $$
DECLARE
  c_id UUID;
BEGIN
  SELECT id INTO c_id FROM public.courses WHERE title = 'Introduction to Python' LIMIT 1;
  IF c_id IS NOT NULL THEN
    INSERT INTO public.course_modules (course_id, title, content, order_index, duration) VALUES
      (c_id, 'Getting Started with Python',
       'Python is a high-level, interpreted programming language known for its clear syntax and readability. In this module, you will set up your development environment and write your first Python program.

Key Concepts:
- What is Python and why learn it?
- Installing Python and VS Code
- Running your first script: print("Hello, World!")
- Python REPL (interactive shell)
- Comments and code structure',
       1, '20 min'),
      (c_id, 'Variables & Data Types',
       'Variables store data values. Python is dynamically typed — you don''t need to declare a type.

Data Types:
- int: whole numbers (x = 10)
- float: decimal numbers (y = 3.14)
- str: text ("hello")
- bool: True or False
- list: ordered collection [1, 2, 3]
- dict: key-value pairs {"name": "Alice"}

Try it:
name = "Rahul"
age = 20
gpa = 8.5
print(f"Name: {name}, Age: {age}, GPA: {gpa}")',
       2, '30 min'),
      (c_id, 'Control Flow',
       'Control flow lets your program make decisions and repeat actions.

if / elif / else:
x = 10
if x > 0:
    print("Positive")
elif x == 0:
    print("Zero")
else:
    print("Negative")

Loops:
for i in range(5):    # 0, 1, 2, 3, 4
    print(i)

while count > 0:
    count -= 1',
       3, '25 min'),
      (c_id, 'Functions',
       'Functions let you reuse code and keep your programs organized.

def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)  # Hello, Alice!

Key Concepts:
- def keyword
- Parameters and arguments
- return statement
- Default parameters
- *args and **kwargs',
       4, '30 min'),
      (c_id, 'Object-Oriented Programming',
       'OOP organizes code around objects that combine data and behavior.

class Student:
    def __init__(self, name, prn):
        self.name = name
        self.prn = prn

    def introduce(self):
        return f"Hi, I am {self.name} (PRN: {self.prn})"

s = Student("Rahul", "123456789012")
print(s.introduce())',
       5, '35 min')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
