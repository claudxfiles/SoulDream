-- Create trial_usage table
CREATE TABLE IF NOT EXISTS trial_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    trial_used BOOLEAN DEFAULT false,
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent multiple trials for same user and plan
CREATE UNIQUE INDEX idx_unique_user_plan_trial ON trial_usage(user_id, plan_id);

-- Create indexes for better query performance
CREATE INDEX idx_trial_usage_user_id ON trial_usage(user_id);
CREATE INDEX idx_trial_usage_plan_id ON trial_usage(plan_id);
CREATE INDEX idx_trial_usage_trial_used ON trial_usage(trial_used);

-- Enable RLS
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trial usage"
    ON trial_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert trial usage"
    ON trial_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only system can update trial usage"
    ON trial_usage FOR UPDATE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_trial_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trial_usage_updated_at
    BEFORE UPDATE ON trial_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_trial_usage_updated_at();

-- Add comment to explain table purpose
COMMENT ON TABLE trial_usage IS 'Tracks trial period usage for subscription plans per user'; 