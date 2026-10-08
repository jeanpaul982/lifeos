-- ==========================================
-- LIFEOS - SUPABASE DATABASE SCHEMA & RLS
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. PROFILES TABLE (Linked with auth.users)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 2. GOALS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Estudios', 'Gym', 'Deporte', 'Hábitos', 'Proyectos', 'Startup', 'Personal')) DEFAULT 'Personal',
    level TEXT CHECK (level IN ('GRANDE', 'MENSUAL', 'SEMANAL')) DEFAULT 'SEMANAL',
    parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    target_date DATE,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT CHECK (status IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO')) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 3. TASKS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')) DEFAULT 'MEDIA',
    category TEXT CHECK (category IN ('Estudios', 'Gym', 'Deporte', 'Hábitos', 'Proyectos', 'Startup', 'Personal')) DEFAULT 'Personal',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_minutes INT DEFAULT 30,
    status TEXT CHECK (status IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO')) DEFAULT 'PENDIENTE',
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 3b. CALENDAR EVENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    category TEXT CHECK (category IN ('Estudios', 'Gym', 'Deporte', 'Hábitos', 'Proyectos', 'Startup', 'Personal')) DEFAULT 'Personal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 4. HABITS & HABIT LOGS
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('DIARIO', 'SEMANAL', 'DIAS_LABORABLES')) DEFAULT 'DIARIO',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (habit_id, date)
);

-- ------------------------------------------
-- 5. FOCUS SESSIONS
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 6. STUDY MODULE (Courses, Topics, Sessions)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.study_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.study_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 7. GYM MODULE (Workouts & Exercises)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps INT NOT NULL DEFAULT 10,
    weight NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 8. SPORTS SESSIONS
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.sports_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sport TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT NOT NULL,
    intensity TEXT CHECK (intensity IN ('SUAVE', 'MODERADA', 'ALTA', 'EXTREMA')) DEFAULT 'MODERADA',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 9. PROJECTS MODULE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('IDEA', 'PLANIFICACION', 'DESARROLLO', 'PRUEBAS', 'COMPLETADO')) DEFAULT 'IDEA',
    priority TEXT CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')) DEFAULT 'MEDIA',
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('IDEA', 'PLANIFICACION', 'DESARROLLO', 'PRUEBAS', 'COMPLETADO')) DEFAULT 'PLANIFICACION',
    priority TEXT CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA')) DEFAULT 'MEDIA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 10. STARTUP WORKSPACE MODULE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.startup_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.startup_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.startup_workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('FOUNDER', 'CEO', 'CTO', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'ADVISOR')) DEFAULT 'DEVELOPER',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.startup_roadmap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.startup_workspaces(id) ON DELETE CASCADE,
    stage TEXT CHECK (stage IN ('IDEA', 'VALIDACIÓN', 'MVP', 'PRIMER USUARIO', 'PRIMER CLIENTE', 'INGRESOS')) NOT NULL,
    status TEXT CHECK (status IN ('PENDIENTE', 'EN_PROGRESO', 'ALCANZADO')) DEFAULT 'PENDIENTE',
    notes TEXT,
    target_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.startup_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.startup_workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('FEATURE', 'IDEA', 'BUG', 'MEJORA')) DEFAULT 'FEATURE',
    priority TEXT CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')) DEFAULT 'MEDIA',
    status TEXT CHECK (status IN ('BACKLOG', 'EN_DESARROLLO', 'COMPLETADO')) DEFAULT 'BACKLOG',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.startup_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.startup_workspaces(id) ON DELETE CASCADE,
    assigned_member_id UUID REFERENCES public.startup_members(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO')) DEFAULT 'PENDIENTE',
    priority TEXT CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA')) DEFAULT 'MEDIA',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_members_workspace ON public.startup_members(workspace_id);

-- ------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_tasks ENABLE ROW LEVEL SECURITY;

-- Helper macro for user-owned tables
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own calendar_events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habit_logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own focus_sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own study_courses" ON public.study_courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own study_topics" ON public.study_topics FOR ALL USING (
    EXISTS (SELECT 1 FROM public.study_courses WHERE id = study_topics.course_id AND user_id = auth.uid())
);
CREATE POLICY "Users access own study_sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own workout_exercises" ON public.workout_exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_exercises.workout_id AND user_id = auth.uid())
);
CREATE POLICY "Users access own sports_sessions" ON public.sports_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own project_tasks" ON public.project_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND user_id = auth.uid())
);

-- STARTUP WORKSPACE RLS (Accessible by Workspace Owner OR Members)
CREATE POLICY "Workspace owner or member read" ON public.startup_workspaces FOR SELECT USING (
    auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.startup_members WHERE workspace_id = startup_workspaces.id AND user_id = auth.uid())
);
CREATE POLICY "Workspace owner write" ON public.startup_workspaces FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members access startup_members" ON public.startup_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.startup_workspaces WHERE id = startup_members.workspace_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.startup_members sm WHERE sm.workspace_id = startup_workspaces.id AND sm.user_id = auth.uid())))
);

CREATE POLICY "Members access startup_roadmap" ON public.startup_roadmap FOR ALL USING (
    EXISTS (SELECT 1 FROM public.startup_workspaces WHERE id = startup_roadmap.workspace_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.startup_members WHERE workspace_id = startup_workspaces.id AND user_id = auth.uid())))
);

CREATE POLICY "Members access startup_products" ON public.startup_products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.startup_workspaces WHERE id = startup_products.workspace_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.startup_members WHERE workspace_id = startup_workspaces.id AND user_id = auth.uid())))
);

CREATE POLICY "Members access startup_tasks" ON public.startup_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.startup_workspaces WHERE id = startup_tasks.workspace_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.startup_members WHERE workspace_id = startup_workspaces.id AND user_id = auth.uid())))
);

-- ------------------------------------------
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
