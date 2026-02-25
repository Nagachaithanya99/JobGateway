import { createContext, useMemo } from "react";
import { useAuth } from "../hooks/useAuth.js";

export const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { auth } = useAuth();
  const role = auth?.role || "guest";

  const value = useMemo(() => ({ role }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
