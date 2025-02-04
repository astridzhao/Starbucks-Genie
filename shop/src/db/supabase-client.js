import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and API Key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

// Initialization: Create a single Supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey);

export default supabase;