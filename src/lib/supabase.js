import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// SQL to run in Supabase SQL Editor to create all tables:
/*
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('coordinator', 'assistant_coordinator', 'secretary', 'researcher', 'member')),
  entity_name text,
  phone text,
  created_at timestamptz default now()
);

-- Member entities
create table member_entities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text check (type in ('Church', 'Missionary training school', 'Missionary sending entity', 'Mission mobilization entity')),
  state_location text,
  contact_person text,
  contact_phone text,
  contact_email text,
  status text default 'active' check (status in ('active', 'inactive', 'probationary')),
  joined_date date,
  focus_areas text[],
  notes text,
  created_at timestamptz default now()
);

-- UPG tracker
create table upgs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  population_estimate text,
  language text,
  religion text,
  engagement_stage text default 'Unassigned' check (engagement_stage in (
    'Unassigned', 'Stage 1 - Research/Prayer', 'Stage 2 - Entry/Contact',
    'Stage 3 - Initial Disciples', 'Stage 4 - Church Formation',
    'Stage 5 - Multiplication', 'Stage 6 - Movement Emerging', 'Stage 7 - Sustained Movement'
  )),
  assigned_entity_id uuid references member_entities(id) on delete set null,
  prayer_points text,
  research_notes text,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Meetings
create table meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in ('Monthly coordinators call', 'Quarterly hub meeting', 'Annual meeting', 'Special/Ad-hoc meeting')),
  meeting_date date not null,
  platform_venue text,
  agenda text,
  minutes text,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  attendees text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in ('Meeting minutes', 'Progress report', 'UPG research report', 'Financial report', 'Other')),
  doc_date date,
  summary text,
  content text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Finances
create table finances (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('income', 'expense')),
  description text not null,
  amount numeric(12,2) not null,
  transaction_date date,
  category text,
  recorded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Hub stage checklist
create table stage_checklist (
  id uuid default uuid_generate_v4() primary key,
  stage_number integer not null,
  item_text text not null,
  is_completed boolean default false,
  completed_date date,
  completed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Insert default Stage 1 and Stage 2 checklist items
insert into stage_checklist (stage_number, item_text, is_completed) values
(1, 'Three or more entities willing to form the hub', true),
(1, 'Entities committed to mission mobilization, training, sending or support', true),
(1, 'GlobeServe ICT approval received', true),
(1, 'Steering committee and initial officers formed', true),
(2, 'Hub launch event held (ideally alongside a GlobeServe training event)', false),
(2, 'Hub leadership formally installed by GlobeServe representatives', false),
(2, 'Hub reported to GlobeServe Council — Associate Hub status received', false),
(2, 'UPG research commenced for Southern Nigeria people groups', false),
(2, 'Member entities beginning UPG adoption and prayer', false),
(2, 'Regular monthly coordinator meetings established', false);

-- Needs assessment (member entity questionnaire)
create table needs_assessments (
  id uuid default uuid_generate_v4() primary key,
  organisation_name text not null,
  states_of_operation text,
  org_type text,
  active_missionaries integer,
  ministry_focus text[],
  ministry_focus_other text,
  top_challenges text[],
  top_challenges_other text,
  support_areas text[],
  support_areas_other text,
  upgs_engaging text,
  engagement_stage text,
  training_needed text,
  priorities_next_3_years text,
  submitted_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Ministry activities (photos, minutes & programme records per member entity)
create table ministry_activities (
  id uuid default uuid_generate_v4() primary key,
  entity_id uuid references member_entities(id) on delete cascade,
  title text not null,
  activity_date date,
  activity_type text check (activity_type in ('Outreach / Evangelism', 'Training / Discipleship', 'Church planting', 'Prayer event', 'Fellowship / Meeting', 'Relief / Community project', 'Other')),
  description text,
  minutes_notes text,
  photo_urls text[],
  recorded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Activity log
create table activity_log (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  entity_type text,
  entity_id uuid,
  performed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Row Level Security policies
alter table profiles enable row level security;
alter table member_entities enable row level security;
alter table upgs enable row level security;
alter table meetings enable row level security;
alter table documents enable row level security;
alter table finances enable row level security;
alter table stage_checklist enable row level security;
alter table needs_assessments enable row level security;
alter table ministry_activities enable row level security;
alter table activity_log enable row level security;

-- Allow authenticated users to read all hub data
create policy "Authenticated users can read all" on member_entities for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on upgs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on meetings for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on documents for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on stage_checklist for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on needs_assessments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all" on ministry_activities for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert ministry_activities" on ministry_activities for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update ministry_activities" on ministry_activities for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete ministry_activities" on ministry_activities for delete using (auth.role() = 'authenticated');
create policy "Authenticated can insert needs_assessments" on needs_assessments for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can read activity" on activity_log for select using (auth.role() = 'authenticated');

-- Only coordinators can write (role checked via profiles)
create policy "Authenticated can insert member_entities" on member_entities for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update member_entities" on member_entities for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert upgs" on upgs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update upgs" on upgs for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert meetings" on meetings for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update meetings" on meetings for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert documents" on documents for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can insert finances" on finances for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can read finances" on finances for select using (auth.role() = 'authenticated');
create policy "Authenticated can update checklist" on stage_checklist for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert activity" on activity_log for insert with check (auth.role() = 'authenticated');
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Storage bucket for ministry activity photos (run this too)
insert into storage.buckets (id, name, public) values ('ministry-photos', 'ministry-photos', true)
on conflict (id) do nothing;

create policy "Public can view ministry photos" on storage.objects for select using (bucket_id = 'ministry-photos');
create policy "Authenticated can upload ministry photos" on storage.objects for insert with check (bucket_id = 'ministry-photos' and auth.role() = 'authenticated');
create policy "Authenticated can delete ministry photos" on storage.objects for delete using (bucket_id = 'ministry-photos' and auth.role() = 'authenticated');
*/
