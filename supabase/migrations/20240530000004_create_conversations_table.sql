-- Crear tabla de conversaciones con IA
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Crear tabla de mensajes de conversaciones
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tokens_used INTEGER
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Habilitar RLS para conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen para evitar duplicados
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias conversaciones" ON conversations;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias conversaciones" ON conversations;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias conversaciones" ON conversations;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias conversaciones" ON conversations;

-- Políticas de seguridad para conversations
CREATE POLICY "Los usuarios pueden ver sus propias conversaciones" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias conversaciones" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias conversaciones" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias conversaciones" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Habilitar RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen para evitar duplicados
DROP POLICY IF EXISTS "Los usuarios pueden ver mensajes de sus propias conversaciones" ON messages;
DROP POLICY IF EXISTS "Los usuarios pueden crear mensajes en sus propias conversaciones" ON messages;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar mensajes de sus propias conversaciones" ON messages;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar mensajes de sus propias conversaciones" ON messages;

-- Políticas de seguridad para messages
CREATE POLICY "Los usuarios pueden ver mensajes de sus propias conversaciones" ON messages
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id)
  );

CREATE POLICY "Los usuarios pueden crear mensajes en sus propias conversaciones" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id)
  );

CREATE POLICY "Los usuarios pueden actualizar mensajes de sus propias conversaciones" ON messages
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id)
  );

CREATE POLICY "Los usuarios pueden eliminar mensajes de sus propias conversaciones" ON messages
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id)
  );

-- Trigger para actualizar automáticamente el campo updated_at en conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_timestamp ON conversations;
CREATE TRIGGER update_conversations_timestamp
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Trigger para actualizar automáticamente la última actualización de la conversación cuando se añade un mensaje
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_after_message ON messages;
CREATE TRIGGER update_conversation_after_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message(); 