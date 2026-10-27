import { useEffect, useState, useCallback } from "react";
import { authApi } from "../api/authApi.js";
import { getCsrfToken, clearSession } from "../api/client.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(getCsrfToken()));

  const loadSession = useCallback(async () => {
    try {
      const result = await authApi.me();
      setSession({ user: result.user, business: result.business });
      return result;
    } catch {
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    authApi.me().then((result) => {
      if (active) {
        setSession({ user: result.user, business: result.business });
        setLoading(false);
      }
    }).catch(() => {
      if (active) {
        setSession(null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      authApi.logout().catch(() => {});
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
      clearSession();
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
