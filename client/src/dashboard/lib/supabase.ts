import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://giflfgxfemyawxkutjlt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmxmZ3hmZW15YXd4a3V0amx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTY4NTUsImV4cCI6MjEwODU3Mjg1NX0.noLwhOirugP3k-Ty2EOqfoZhcgtEQkW00PDvePCEnjE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

