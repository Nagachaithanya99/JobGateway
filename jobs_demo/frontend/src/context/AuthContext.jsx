import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";

const DEMO_AUTH_KEY = "demo_auth";
const LOCAL_ADMIN_AUTH_KEY = "jobgateway_local_admin_auth";
const ALLOW_DEMO_AUTH = String(import.meta.env.VITE_ALLOW_DEMO_AUTH || "") === "1";

function readDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDemoUser(user) {
  if (!user) {
    localStorage.removeItem(DEMO_AUTH_KEY);
    return;
  }

  localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(user));
}

function readLocalAdminAuth() {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalAdminAuth(value) {
  if (!value) {
    localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
    return;
  }

  localStorage.setItem(LOCAL_ADMIN_AUTH_KEY, JSON.stringify(value));
}

function getClerkRole(clerkUser) {
  const role = clerkUser?.publicMetadata?.role || clerkUser?.unsafeMetadata?.role;
  // Default signed-in users to student when role metadata is missing.
  return typeof role === "string" && role.trim() ? role.toLowerCase() : "student";
}

function mapClerkUser(clerkUser) {
  if (!clerkUser) return null;

  const first = clerkUser.firstName || "";
  const last = clerkUser.lastName || "";
  const fullName = `${first} ${last}`.trim();

  return {
    id: clerkUser.id,
    name: fullName || clerkUser.username || "User",
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    role: getClerkRole(clerkUser),
  };
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();

  const [demoUser, setDemoUser] = useState(() => (ALLOW_DEMO_AUTH ? readDemoUser() : null));
  const [localAdminAuth, setLocalAdminAuth] = useState(readLocalAdminAuth);

  const user = useMemo(() => {
    if (isSignedIn) return mapClerkUser(clerkUser);
    if (localAdminAuth?.user?.role === "admin" && localAdminAuth?.token) return localAdminAuth.user;
    return ALLOW_DEMO_AUTH ? demoUser : null;
  }, [isSignedIn, clerkUser, localAdminAuth, demoUser]);

  const role = user?.role || null;
  const isAuthed = Boolean(user);
  const loading = !isLoaded || (isSignedIn && !clerkUser);

  const login = useCallback((payload) => {
    if (payload?.token && payload?.user?.role === "admin") {
      const nextAuth = { token: payload.token, user: payload.user };
      setLocalAdminAuth(nextAuth);
      writeLocalAdminAuth(nextAuth);
      return;
    }

    if (!ALLOW_DEMO_AUTH) return;
    const nextUser = payload?.user || payload || null;
    setDemoUser(nextUser);
    writeDemoUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    if (isSignedIn) {
      await signOut();
    }

    if (ALLOW_DEMO_AUTH) {
      setDemoUser(null);
      writeDemoUser(null);
    }

    setLocalAdminAuth(null);
    writeLocalAdminAuth(null);
  }, [isSignedIn, signOut]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthed,
      loading,
      login,
      logout,
      localAdminToken: localAdminAuth?.token || "",
      auth: { user, role },
    }),
    [user, role, isAuthed, loading, login, logout, localAdminAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (ctx) return ctx;

  return {
    user: null,
    role: null,
    isAuthed: false,
    loading: false,
    login: () => {},
    logout: async () => {},
    auth: { user: null, role: null },
  };
}
