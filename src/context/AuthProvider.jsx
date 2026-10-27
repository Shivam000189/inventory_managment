import { useEffect, useState, useCallback } from "react";
import { authApi } from "../api/authApi.js";
import { getCsrfToken } from "../api/client.js";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(getCsrfToken()));

  const loadSession = useCallback(async (isMounted = () => true) => {
    try {
      const result = await authApi.me();
      if (isMounted()) {
        setSession({ user: result.user, business: result.business });
      }
      return result;
    } catch {
      if (isMounted()) {
        setSession(null);
      }
      return null;
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadSession(() => active);
      }
    });
    return () => {
      active = false;
    };
  }, [loadSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
    };
    window.addEventListener("stockroom:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("stockroom:unauthorized", handleUnauthorized);
  }, []);

  const login = async (identifier, password) => {
    const result = await authApi.login({ identifier, password });
    setSession({ user: result.user, business: result.business });
    return result;
  };

  const register = async (payload) => {
    const result = await authApi.register(payload);
    setSession({ user: result.user, business: result.business });
    return result;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setSession(null);
    }
  };

  const updateBusiness = (updatedBusiness) => {
    setSession((curr) => (curr ? { ...curr, business: updatedBusiness } : curr));
  };

  const updateSession = (newSession) => {
    setSession((curr) => {
      if (!curr) return newSession;
      return {
        ...curr,
        user: newSession.user || curr.user,
        business: newSession.business || curr.business,
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        account: session?.user || null,
        business: session?.business || null,
        loading,
        login,
        register,
        logout,
        updateBusiness,
        updateSession,
        refetchSession: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
