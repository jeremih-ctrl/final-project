import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qvsnzleccwaxhymsxrwd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c256bGVjY3dheGh5bXN4cndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjY2MjUsImV4cCI6MjA5MzQ0MjYyNX0.aRrtERCsRdGVtkndF2A4aq4fbrN5WgEfmx7P_iIuvGM";

/**
 * Browser-safe Supabase client.
 * Protected by Row Level Security (RLS) policies on the Supabase database.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
