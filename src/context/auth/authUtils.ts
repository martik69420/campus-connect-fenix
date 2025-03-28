import { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['profiles']['Row'];
type UserAttributes = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export async function getSession({ supabase }: { supabase: SupabaseClient }) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

export async function getProfile({
  supabase,
  session,
}: {
  supabase: SupabaseClient;
  session: Session | null;
}) {
  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session?.user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return profile;
}

export async function subscribeToAuthChanges({
  supabase,
  callback,
}: {
  supabase: SupabaseClient;
  callback: (event: AuthChangeEvent, session: Session | null) => void;
}) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function updateProfile({
  supabase,
  user,
  attributes,
}: {
  supabase: SupabaseClient;
  user: Session['user'];
  attributes: UserAttributes;
}) {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    ...attributes,
  });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function signOut({ supabase }: { supabase: SupabaseClient }) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
