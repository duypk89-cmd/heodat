
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ouvvvjhxdjdvmhnlxewb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dnZ2amh4ZGpkdm1obmx4ZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODk2ODEsImV4cCI6MjA4MzQ2NTY4MX0.rOL7YQss0vFlo3GEKuDJ9azTAZ-ewX4T17Jbi8HUgLU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
