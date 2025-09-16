-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create DID table
CREATE TABLE IF NOT EXISTS dids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    did VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DID Document table
CREATE TABLE IF NOT EXISTS did_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    did_id UUID REFERENCES dids(id) ON DELETE CASCADE,
    document JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Private Keys table (encrypted storage)
CREATE TABLE IF NOT EXISTS private_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    did_id UUID REFERENCES dids(id) ON DELETE CASCADE,
    key_type VARCHAR(50) NOT NULL, -- 'ed25519' or 'x25519'
    name VARCHAR(100) NOT NULL, -- Human-readable name for the key pair
    key_usage VARCHAR(20) NOT NULL, -- 'authentication', 'assertionMethod', or 'keyAgreement'
    active BOOLEAN NOT NULL DEFAULT TRUE, -- Whether the key is active
    encrypted_private_key TEXT NOT NULL,
    public_key TEXT NOT NULL,
    key_derivation_path VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dids_did ON dids(did);
CREATE INDEX IF NOT EXISTS idx_did_documents_did_id ON did_documents(did_id);
CREATE INDEX IF NOT EXISTS idx_private_keys_did_id ON private_keys(did_id);
CREATE INDEX IF NOT EXISTS idx_private_keys_key_type ON private_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_private_keys_name ON private_keys(name);
CREATE INDEX IF NOT EXISTS idx_private_keys_key_usage ON private_keys(key_usage);
CREATE INDEX IF NOT EXISTS idx_private_keys_active ON private_keys(active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_private_keys_did_name_unique ON private_keys(did_id, name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_dids_updated_at BEFORE UPDATE ON dids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_did_documents_updated_at BEFORE UPDATE ON did_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_keys_updated_at BEFORE UPDATE ON private_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE dids ENABLE ROW LEVEL SECURITY;
ALTER TABLE did_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on dids" ON dids
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on did_documents" ON did_documents
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on private_keys" ON private_keys
    FOR ALL USING (true);
