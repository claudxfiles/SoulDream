-- Add subscription_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- Add check constraint to ensure valid status values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('active', 'suspended') OR subscription_status IS NULL);

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status of the user subscription: active, suspended, or null if no subscription'; 