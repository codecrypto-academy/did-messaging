-- Agregar campo mnemonic a la tabla dids
ALTER TABLE dids ADD COLUMN IF NOT EXISTS mnemonic TEXT;

-- Crear índice para el mnemonic
CREATE INDEX IF NOT EXISTS idx_dids_mnemonic ON dids(mnemonic);

-- Mostrar la estructura actualizada
\d dids;
