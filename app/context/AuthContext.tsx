"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Role = "VOLUNTEER" | "COORDINATOR" | null;

export type UserData = {
  id: string;
  name: string;
  email: string;
};

interface AuthContextType {
  role: Role;
  user: UserData | null;
  loginAsCoordinator: (user: UserData) => void;
  loginAsVolunteer: (user: UserData) => void;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("authRole") as Role;
    const savedUser = localStorage.getItem("authUser");
    
    if (savedRole === "COORDINATOR" && savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole("COORDINATOR");
      try {
         
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    } else if (savedRole === "VOLUNTEER" && savedUser) {
       
      setRole("VOLUNTEER");
      try {
         
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
     
     
    setIsHydrated(true);
  }, []);

  const loginAsCoordinator = (c: UserData) => {
    setRole("COORDINATOR");
    setUser(c);
    localStorage.setItem("authRole", "COORDINATOR");
    localStorage.setItem("authUser", JSON.stringify(c));
  };

  const loginAsVolunteer = (v: UserData) => {
    setRole("VOLUNTEER");
    setUser(v);
    localStorage.setItem("authRole", "VOLUNTEER");
    localStorage.setItem("authUser", JSON.stringify(v));
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{ role, user, loginAsCoordinator, loginAsVolunteer, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
