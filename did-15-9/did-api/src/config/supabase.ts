import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  throw new Error('Missing Supabase key. Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  supabase: {
    url: supabaseUrl,
    key: supabaseKey
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_here'
  },
  mnemonic: {
    test: process.env.ANVIL_MNEMONIC || 'test test test test test test test test test test test junk'
  }
};
