import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";

const DEMO_AUTH_KEY = "demo_auth";

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

  const [demoUser, setDemoUser] = useState(readDemoUser);

  const user = useMemo(() => {
    if (isSignedIn) return mapClerkUser(clerkUser);
    return demoUser;
  }, [isSignedIn, clerkUser, demoUser]);

  const role = user?.role || null;
  const isAuthed = Boolean(user);
  const loading = !isLoaded || (isSignedIn && !clerkUser);

  const login = useCallback((payload) => {
    const nextUser = payload?.user || payload || null;
    setDemoUser(nextUser);
    writeDemoUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    if (isSignedIn) {
      await signOut();
    }

    setDemoUser(null);
    writeDemoUser(null);
  }, [isSignedIn, signOut]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthed,
      loading,
      login,
      logout,
      auth: { user, role },
    }),
    [user, role, isAuthed, loading, login, logout],
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
