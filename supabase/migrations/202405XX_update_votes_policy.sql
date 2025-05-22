-- Enable RLS if not already enabled
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Remove any existing update policies (optional, for a clean slate)
DROP POLICY IF EXISTS "Allow authenticated users to update votes" ON parties;

-- Create a new policy: allow authenticated users to update only the votes column
CREATE POLICY "Allow authenticated users to update votes"
  ON parties
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      -- Only allow updating the votes column
      (votes IS DISTINCT FROM parties.votes)
      AND (title = parties.title)
      AND (location = parties.location)
      AND (description = parties.description)
      AND (date = parties.date)
      AND (user_id = parties.user_id)
      AND (latitude = parties.latitude)
      AND (longitude = parties.longitude)
    )
  );

-- (Optional) Allow party creators to update/delete their own parties as before
-- CREATE POLICY "Allow party owner to update/delete"
--   ON parties
--   FOR UPDATE, DELETE
--   USING (auth.uid() = user_id);

-- (Optional) Allow anyone to insert (create) a party
-- CREATE POLICY "Allow anyone to insert party"
--   ON parties
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
