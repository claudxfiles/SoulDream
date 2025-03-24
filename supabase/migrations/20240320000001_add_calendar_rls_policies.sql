-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Calendar events policies
CREATE POLICY "Users can insert their own calendar events"
ON calendar_events FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar events"
ON calendar_events FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
ON calendar_events FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
ON calendar_events FOR DELETE 
TO authenticated
USING (auth.uid() = user_id); 