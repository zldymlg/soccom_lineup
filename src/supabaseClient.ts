// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Read Vite environment variables exposed to the client. These must be prefixed with VITE_
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // When running in some environments these may be undefined — warn for easier debugging
    // (You can remove this check in production once envs are configured.)
    // eslint-disable-next-line no-console
    console.warn('Supabase env variables are not set: import.meta.env.VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
