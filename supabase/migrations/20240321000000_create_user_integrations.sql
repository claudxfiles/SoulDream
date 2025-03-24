-- Parte 1: Crear la tabla user_integrations
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google_calendar', 'twitter', etc.
    credentials JSONB NOT NULL, -- Stores tokens and other auth info
    metadata JSONB, -- Additional provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Añadir restricción única después de crear la tabla
ALTER TABLE user_integrations ADD CONSTRAINT user_integrations_user_id_provider_unique UNIQUE(user_id, provider);

-- Create index on user_id and provider for faster queries
CREATE INDEX IF NOT EXISTS user_integrations_user_id_provider_idx ON user_integrations(user_id, provider);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Parte 2: Crear las políticas RLS y triggers
CREATE POLICY "Users can insert their own integrations"
ON user_integrations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own integrations"
ON user_integrations FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
ON user_integrations FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
ON user_integrations FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before an update
CREATE TRIGGER update_user_integrations_updated_at
BEFORE UPDATE ON user_integrations
FOR EACH ROW
EXECUTE FUNCTION update_user_integrations_updated_at();