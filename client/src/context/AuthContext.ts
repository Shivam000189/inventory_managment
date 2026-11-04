import { createContext } from "react";
import type { Account, BusinessProfile, UserSession } from "../types";

export interface AuthContextValue {
  session: UserSession | null;
  account: Account | null;
  business: BusinessProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateBusiness: (updatedBusiness: any) => void;
  updateSession: (newSession: any) => void;
  refetchSession: (isMounted?: () => boolean) => Promise<any>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
