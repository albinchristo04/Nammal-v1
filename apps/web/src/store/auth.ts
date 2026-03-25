import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserStatus = "pending" | "verified" | "rejected" | "suspended";

interface User {
  id: string;
  phone: string;
  status: UserStatus;
  gender: "male" | "female";
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => {
        if (typeof document !== "undefined") {
          document.cookie = "nammal_session=; path=/; max-age=0";
        }
        localStorage.removeItem("accessToken");
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: "nammal-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
