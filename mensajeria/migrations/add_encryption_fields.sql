-- Add encryption fields to messages table
ALTER TABLE public.messages 
ADD COLUMN encrypted_content text,
ADD COLUMN sender_public_key text,
ADD COLUMN encryption_algorithm text DEFAULT 'x25519-aes-gcm';

-- Update the content column to be nullable since we'll use encrypted_content
ALTER TABLE public.messages 
ALTER COLUMN content DROP NOT NULL;

-- Add index for better performance on encrypted messages
CREATE INDEX idx_messages_encryption ON public.messages (encryption_algorithm, sender_public_key);

-- Add comment explaining the encryption fields
COMMENT ON COLUMN public.messages.encrypted_content IS 'Encrypted message content using Diffie-Hellman key agreement';
COMMENT ON COLUMN public.messages.sender_public_key IS 'Public key used for encryption (x25519 keyAgreement key)';
COMMENT ON COLUMN public.messages.encryption_algorithm IS 'Algorithm used for encryption (e.g., x25519-aes-gcm)';
