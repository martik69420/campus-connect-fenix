// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nqbklvemcxemhgxlnyyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYmtsdmVtY3hlbWhneGxueXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MTIyMTYsImV4cCI6MjA1NzA4ODIxNn0.4z96U7aHqFkOvK8GbdFSh9s8hYDDhUyo9ypstoKpBgo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);