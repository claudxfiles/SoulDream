-- Create function to manage trial usage
CREATE OR REPLACE FUNCTION manage_trial_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new subscription with trial
    IF (TG_OP = 'INSERT' AND NEW.trial_ends_at IS NOT NULL) THEN
        -- Insert or update trial usage record
        INSERT INTO trial_usage (
            user_id,
            plan_id,
            trial_used,
            trial_start_date,
            trial_end_date
        )
        VALUES (
            NEW.user_id,
            NEW.plan_id,
            true,
            NEW.current_period_starts_at,
            NEW.trial_ends_at
        )
        ON CONFLICT (user_id, plan_id) 
        DO UPDATE SET
            trial_used = true,
            trial_start_date = EXCLUDED.trial_start_date,
            trial_end_date = EXCLUDED.trial_end_date,
            updated_at = NOW();
    END IF;

    -- If trial is ending (trial_ends_at changing from not null to null)
    IF (TG_OP = 'UPDATE' AND OLD.trial_ends_at IS NOT NULL AND NEW.trial_ends_at IS NULL) THEN
        -- Update trial usage to mark as used
        UPDATE trial_usage
        SET 
            trial_used = true,
            trial_end_date = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = NEW.user_id 
            AND plan_id = NEW.plan_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS manage_trial_usage_trigger ON subscriptions;

CREATE TRIGGER manage_trial_usage_trigger
    AFTER INSERT OR UPDATE OF trial_ends_at
    ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION manage_trial_usage(); 