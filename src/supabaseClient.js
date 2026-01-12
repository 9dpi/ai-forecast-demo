import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvglzvjsexeaectypkyk.supabase.co'
// Use environment variable first, fallback to hardcoded public key if missing
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_twPEMyojWMfPXfubNA3C3g_xqAAwPHq'

let supabaseInstance = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
        console.log("Supabase initialized successfully.");
    } catch (e) {
        console.error("Supabase initialization failed:", e);
    }
} else {
    console.error("Supabase URL or Key missing. Database connection disabled.");
}

export const supabase = supabaseInstance;
