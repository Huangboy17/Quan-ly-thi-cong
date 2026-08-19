import React, { createContext, useContext, useEffect, useState } from 'react';
// Import your configured supabase client here

interface AuthState {
  session: any | null;
  user: any | null;
  profile: any | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthState>({ session: null, user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode, supabase: any }> = ({ children, supabase }) => {
  const [state, setState] = useState<AuthState>({ session: null, user: null, profile: null, loading: true });

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (session: any) => {
      if (!session?.user) {
        if (mounted) setState({ session: null, user: null, profile: null, loading: false });
        return;
      }
      const { data } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
      if (mounted) setState({ session, user: session.user, profile: data, loading: false });
    };

    supabase.auth.getSession().then(({ data: { session } }: any) => fetchProfile(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setState(prev => ({ ...prev, loading: true }));
      fetchProfile(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
