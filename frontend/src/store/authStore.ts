import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  employeeId: string;
  employeeCode: string;
  name: string;
  role: 'Owner' | 'Cashier';
  branchId: string;
}

interface AuthState {
  token: string | null;
  session: Session | null;
  setAuth: (token: string, session: Session) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      session: null,
      setAuth: (token, session) => set({ token, session }),
      logout: () => set({ token: null, session: null }),
    }),
    {
      name: 'al_ameen_auth', // This replaces the old AL_AMEEN_TOKEN_KEY
    },
  ),
);
