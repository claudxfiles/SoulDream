-- Habilitar RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias transacciones" ON transactions;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias transacciones" ON transactions;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias transacciones" ON transactions;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias transacciones" ON transactions;

-- Crear nuevas políticas de seguridad para transactions
CREATE POLICY "Los usuarios pueden ver sus propias transacciones" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias transacciones" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias transacciones" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias transacciones" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Crear índices para búsquedas eficientes si no existen
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Verificar y corregir transacciones sin user_id
UPDATE transactions 
SET user_id = auth.uid()
WHERE user_id IS NULL; 