import { createContext, useContext, useState, ReactNode } from "react";
import { loginUser, registerUser } from "../api/client";

interface AuthState {
  email: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem("homai_email"));

  const login = async (em: string, pw: string) => {
    const res = await loginUser(em, pw);
    localStorage.setItem("homai_token", res.access_token);
    localStorage.setItem("homai_email", res.email);
    setEmail(res.email);
  };

  const register = async (em: string, pw: string) => {
    const res = await registerUser(em, pw);
    localStorage.setItem("homai_token", res.access_token);
    localStorage.setItem("homai_email", res.email);
    setEmail(res.email);
    // Once they register, the "guest used" flag stops mattering
    localStorage.removeItem("homai_guest_used");
  };

  const logout = () => {
    localStorage.removeItem("homai_token");
    localStorage.removeItem("homai_email");
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ email, isLoggedIn: !!email, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Helpers for the guest gate. The first design is free; the second prompts registration.
export function hasUsedGuestSlot(): boolean {
  return localStorage.getItem("homai_guest_used") === "1";
}

export function markGuestSlotUsed(): void {
  localStorage.setItem("homai_guest_used", "1");
}
