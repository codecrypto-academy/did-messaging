-- Add recipient public key field to messages table for decryption
ALTER TABLE public.messages 
ADD COLUMN recipient_public_key text;

-- Add comment explaining the recipient public key field
COMMENT ON COLUMN public.messages.recipient_public_key IS 'Public key of the recipient used for encryption (needed for sender to decrypt own messages)';

-- Update the index to include recipient public key
DROP INDEX IF EXISTS idx_messages_encryption;
CREATE INDEX idx_messages_encryption ON public.messages (encryption_algorithm, sender_public_key, recipient_public_key);
