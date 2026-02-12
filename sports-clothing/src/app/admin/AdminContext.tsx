"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface ClubInfo {
  id: string;
  name: string;
  slug: string;
}

export interface MembershipInfo {
  id: string;
  clubId: string;
  role: string;
  club: ClubInfo;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  memberships: MembershipInfo[];
}

interface AdminContextType {
  user: AdminUser | null;
  selectedClub: ClubInfo | null;
  setSelectedClub: (club: ClubInfo) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  selectedClub: null,
  setSelectedClub: () => {},
  loading: true,
  refreshUser: async () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [selectedClub, setSelectedClubState] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? data);

      const userData: AdminUser = data.user ?? data;
      setUser(userData);

      // Restore selected club from localStorage or pick first membership
      const savedClubId =
        typeof window !== "undefined"
          ? localStorage.getItem("admin-selected-club")
          : null;

      const memberships = userData.memberships ?? [];
      if (memberships.length > 0) {
        const saved = memberships.find((m) => m.club.id === savedClubId);
        if (saved) {
          setSelectedClubState(saved.club);
        } else {
          setSelectedClubState(memberships[0].club);
          if (typeof window !== "undefined") {
            localStorage.setItem("admin-selected-club", memberships[0].club.id);
          }
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setSelectedClub = (club: ClubInfo) => {
    setSelectedClubState(club);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin-selected-club", club.id);
    }
  };

  return (
    <AdminContext.Provider
      value={{ user, selectedClub, setSelectedClub, loading, refreshUser: fetchUser }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
