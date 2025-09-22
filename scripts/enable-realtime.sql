-- Script SQL para habilitar Supabase Realtime
-- Ejecutar en Supabase Studio → SQL Editor

-- Habilitar realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Habilitar realtime para la tabla conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verificar que las tablas están en la publicación
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Mostrar información sobre la publicación
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';