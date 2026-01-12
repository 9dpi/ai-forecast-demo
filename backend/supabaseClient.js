import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://gvglzvjsexeaectypkyk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
        console.log('[SUPABASE] Backend client initialized ✅');
    } catch (e) {
        console.error('[SUPABASE] Initialization failed:', e);
    }
} else {
    console.error('[SUPABASE] Missing credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
}

export const supabase = supabaseInstance;
