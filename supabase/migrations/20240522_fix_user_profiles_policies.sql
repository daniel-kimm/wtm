-- Drop existing policies
drop policy if exists "Users can view all profiles" on public.user_profiles;
drop policy if exists "Users can update their own profile" on public.user_profiles;

-- Create new policies
create policy "Users can view all profiles"
    on public.user_profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.user_profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.user_profiles for update
    using (auth.uid() = id);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.user_profiles to authenticated;
grant all on public.parties to authenticated; 