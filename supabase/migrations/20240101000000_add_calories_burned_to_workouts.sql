-- Verificar si la columna no existe antes de crearla
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workouts' 
        AND column_name = 'calories_burned'
    ) THEN
        ALTER TABLE workouts 
        ADD COLUMN calories_burned INTEGER;
    END IF;
END $$; 