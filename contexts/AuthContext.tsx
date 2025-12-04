import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { AuthStrategy, UserProfile, AuthState, SubscriptionTier } from '../types';
import Cookies from 'js-cookie';

// --- Default Configuration ---
const DEFAULT_STRATEGY = AuthStrategy.LOCAL;

interface AuthContextType extends AuthState {
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  setStrategy: (strategy: AuthStrategy, config?: any) => void;
  updateLocalUser: (name: string, email: string) => void;
  registerLogoutStrategy: (fn: () => Promise<void>) => void;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Adapter Components ---

// 1. Clerk Adapter - ONLY renders when inside ClerkProvider, so hooks are safe
const ClerkAdapter: React.FC<{ children: ReactNode, onUserSync: (u: UserProfile | null) => void, currentTier: SubscriptionTier }> = ({ children, onUserSync, currentTier }) => {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { registerLogoutStrategy } = useAuth();
  
  useEffect(() => {
    if (clerk && clerk.signOut) {
      registerLogoutStrategy(async () => {
          await clerk.signOut();
      });
    }
  }, [clerk, registerLogoutStrategy]);

  useEffect(() => {
    if (isLoaded && user) {
      onUserSync({
        id: user.id,
        name: user.fullName || user.username || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        role: 'researcher',
        tier: currentTier // In a real app, this would come from Clerk publicMetadata
      });
    } else if (isLoaded && !user) {
      onUserSync(null);
    }
  }, [user, isLoaded, onUserSync, currentTier]);

  return <>{children}</>;
};

// 2. NextAuth Adapter
const NextAuthAdapter: React.FC<{ children: ReactNode, onUserSync: (u: UserProfile | null) => void, currentTier: SubscriptionTier }> = ({ children, onUserSync, currentTier }) => {
  const { data: session, status } = useSession();
  const { registerLogoutStrategy } = useAuth();

  useEffect(() => {
    registerLogoutStrategy(async () => {
        await nextAuthSignOut({ redirect: false });
    });
  }, [registerLogoutStrategy]);
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      onUserSync({
        id: session.user.email || 'nextauth-user',
        name: session.user.name || 'User',
        email: session.user.email || '',
        avatar: session.user.image || undefined,
        role: 'researcher',
        tier: currentTier
      });
    } else if (status === 'unauthenticated') {
      onUserSync(null);
    }
  }, [session, status, onUserSync, currentTier]);

  return <>{children}</>;
};

// --- Main Provider ---

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Config Persistence with Safety Checks
  const [strategy, setStrategyState] = useState<AuthStrategy>(() => {
     try {
        const saved = Cookies.get('proto_auth_strategy');
        // Fallback to LOCAL if cookie is missing or invalid to prevent crash loops
        return (saved as AuthStrategy) || DEFAULT_STRATEGY;
     } catch (e) {
        return DEFAULT_STRATEGY;
     }
  });
  
  const [authConfig, setAuthConfig] = useState<any>(() => {
     try {
         const saved = Cookies.get('proto_auth_config');
         return saved ? JSON.parse(saved) : {};
     } catch (e) {
         return {};
     }
  });

  // Subscription State (Mock Backend Persistence)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(() => {
      try {
          const saved = Cookies.get('proto_subscription');
          return (saved as SubscriptionTier) || SubscriptionTier.FREE;
      } catch {
          return SubscriptionTier.FREE;
      }
  });

  const [localUser, setLocalUser] = useState<UserProfile | null>(() => {
     try {
         const saved = Cookies.get('proto_local_user');
         return saved ? JSON.parse(saved) : null;
     } catch (e) {
         return null;
     }
  });

  const [adapterUser, setAdapterUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Strategy-specific logout function reference
  const logoutStrategyRef = useRef<(() => Promise<void>) | null>(null);

  const registerLogoutStrategy = useCallback((fn: () => Promise<void>) => {
      logoutStrategyRef.current = fn;
  }, []);

  // Helper to persist settings
  const setStrategy = (newStrategy: AuthStrategy, newConfig?: any) => {
    setStrategyState(newStrategy);
    Cookies.set('proto_auth_strategy', newStrategy);
    if (newConfig) {
       const merged = { ...authConfig, ...newConfig };
       setAuthConfig(merged);
       Cookies.set('proto_auth_config', JSON.stringify(merged));
    }
    // Reset users on strategy switch
    if (newStrategy !== AuthStrategy.LOCAL) {
        setLocalUser(null);
    }
    // Clear logout strategy when switching
    logoutStrategyRef.current = null;
  };

  const updateLocalUser = (name: string, email: string) => {
      const u: UserProfile = {
          id: 'local-' + Date.now(),
          name,
          email,
          role: 'researcher',
          avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
          tier: subscriptionTier
      };
      setLocalUser(u);
      Cookies.set('proto_local_user', JSON.stringify(u));
  };

  const upgradeSubscription = async (tier: SubscriptionTier) => {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubscriptionTier(tier);
      Cookies.set('proto_subscription', tier);

      // Propagate change to current user object
      if (strategy === AuthStrategy.LOCAL && localUser) {
          const updated = { ...localUser, tier };
          setLocalUser(updated);
          Cookies.set('proto_local_user', JSON.stringify(updated));
      } 
      // For adapters, the useEffect dependencies will catch the `subscriptionTier` change
      // and update `adapterUser` automatically via the onUserSync callbacks.
  };

  // Unified actions
  const login = async (providerId?: string) => {
     setIsLoading(true);
     if (strategy === AuthStrategy.NEXT_AUTH) {
         await nextAuthSignIn(providerId);
     }
     // Clerk handles login via its UI components
     // Local login is handled by updateLocalUser directly
     setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
        if (logoutStrategyRef.current) {
            await logoutStrategyRef.current();
        } else {
             // Fallback or Local
             setLocalUser(null);
             Cookies.remove('proto_local_user');
        }
        
        // Ensure state is cleared
        if (strategy !== AuthStrategy.LOCAL) {
            setAdapterUser(null);
        } else {
            setLocalUser(null);
        }
    } catch (e) {
        console.error("Logout failed", e);
        // Force clear if strategy failed
        setAdapterUser(null);
        setLocalUser(null);
    } finally {
        setIsLoading(false);
    }
  };

  // Derived State
  // Merge the ephemeral adapter user with the persistent subscription tier
  const activeAdapterUser = adapterUser ? { ...adapterUser, tier: subscriptionTier } : null;
  const activeUser = strategy === AuthStrategy.LOCAL ? localUser : activeAdapterUser;
  
  const isAuthenticated = !!activeUser;

  // Render Logic
  const renderProvider = () => {
    // 1. CLERK
    // Validate key format to prevent crashes (must allow trim() and start with 'pk_')
    const cleanClerkKey = authConfig.clerkKey ? authConfig.clerkKey.trim() : '';
    const isValidClerkKey = cleanClerkKey.startsWith('pk_');

    if (strategy === AuthStrategy.CLERK && isValidClerkKey) {
        return (
            <ClerkProvider publishableKey={cleanClerkKey}>
                <ClerkAdapter onUserSync={setAdapterUser} currentTier={subscriptionTier}>
                    {children}
                </ClerkAdapter>
            </ClerkProvider>
        );
    }
    
    // 2. NEXT AUTH
    // Validate URL to prevent CLIENT_FETCH_ERROR
    const cleanNextAuthUrl = authConfig.nextAuthUrl ? authConfig.nextAuthUrl.trim() : '';
    const isValidNextAuthUrl = cleanNextAuthUrl.startsWith('http');

    if (strategy === AuthStrategy.NEXT_AUTH && isValidNextAuthUrl) {
        return (
            <SessionProvider baseUrl={cleanNextAuthUrl} basePath={cleanNextAuthUrl + '/api/auth'}>
                <NextAuthAdapter onUserSync={setAdapterUser} currentTier={subscriptionTier}>
                    {children}
                </NextAuthAdapter>
            </SessionProvider>
        );
    }

    // Default: Local, or fallback if keys/urls are missing/invalid
    // This allows the LoginScreen to render (unauthenticated) so users can fix the config
    return <>{children}</>;
  };

  return (
    <AuthContext.Provider value={{
        user: activeUser,
        isAuthenticated,
        isLoading,
        strategy,
        config: authConfig,
        login,
        logout,
        setStrategy,
        updateLocalUser,
        registerLogoutStrategy,
        upgradeSubscription
    }}>
      {renderProvider()}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};