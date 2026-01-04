import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authHelpers, Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Helper function to load user profile
  const loadUserProfile = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error loading user profile:', error);
        // Don't throw error, just log it and continue with null profile
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setProfile(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, [loadUserProfile]);

  // Set up auth listener after initialization
  useEffect(() => {
    if (!initialized) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Load profile after a short delay to avoid race conditions
          setTimeout(() => {
            loadUserProfile(session.user.id).catch(console.error);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized, loadUserProfile]);

  // Auth methods with consistent loading state management
  const signIn = React.useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authHelpers.signIn(email, password);
      return result;
    } catch (error) {
      setLoading(false); // Reset loading on error
      throw error;
    }
    // Don't set loading false here - let the auth state change handle it
  }, []);

  const signUp = React.useCallback(async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const result = await authHelpers.signUp(email, password, fullName);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = React.useCallback(async () => {
    setLoading(true);
    try {
      await authHelpers.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const updateProfile = React.useCallback(async (updates: Partial<Profile>) => {
    try {
      const updatedProfile = await authHelpers.updateProfile(updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }, [user, loadUserProfile]);

  const isAdmin = React.useMemo(() => {
    return profile?.role === 'admin';
  }, [profile?.role]);

  const value: AuthContextType = React.useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    isAdmin
  }), [user, profile, session, loading, signIn, signUp, signOut, updateProfile, refreshProfile, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}