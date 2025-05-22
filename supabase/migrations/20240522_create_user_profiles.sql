-- Create user profiles table
create table if not exists public.user_profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Create policies for user profiles
create policy "Users can view all profiles"
    on public.user_profiles for select
    using (true);

create policy "Users can update their own profile"
    on public.user_profiles for update
    using (auth.uid() = id);

-- Create a trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Update parties table to reference user_profiles
alter table public.parties
    drop constraint if exists parties_user_id_fkey,
    add constraint parties_user_id_fkey
    foreign key (user_id)
    references public.user_profiles(id)
    on delete cascade;

-- Create a view to get party details with user information
create or replace view public.parties_with_users as
select 
    p.*,
    up.email as creator_email,
    up.full_name as creator_name,
    up.avatar_url as creator_avatar
from public.parties p
left join public.user_profiles up on p.user_id = up.id; 