import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PermissionSet {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  overridden?: boolean;
  locked?: boolean;
}

export interface Session {
  employeeId: string;
  employeeCode: string;
  name: string;
  role: 'SuperAdmin' | 'Owner' | 'Cashier';
  branchId: string;
  tenantId?: string;
  permissions?: Record<string, PermissionSet>;
}

export interface TenantBranding {
  id: string;
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  currencySymbol: string;
  receiptFooter: string;
  invoicePrefix: string;
  receiptPrefix: string;
  lowStockDefault: number;
  logoDataUrl: string;
  enabledModules: string[];
  subscriptionStatus: string;
}

const DEFAULT_TENANT: TenantBranding = {
  id: 'TENANT-001',
  shopName: 'Al Ameen Provision Store',
  tagline: 'Quality goods & trusted POS services',
  phone: '0803 123 4567',
  address: '12 Market Road, Kano',
  currencySymbol: '₦',
  receiptFooter: 'Thank you for your patronage!',
  invoicePrefix: 'INV-',
  receiptPrefix: 'RCP-',
  lowStockDefault: 5,
  logoDataUrl: '',
  enabledModules: ['provision', 'banking', 'laundry'],
  subscriptionStatus: 'Active',
};

// Global English -> Hausa Dictionary
const HAUSA_DICT: Record<string, string> = {
  Home: 'Gida',
  Overview: 'Bayyani',
  Dashboard: 'Dashbod',
  'Executive Dashboard': 'Dashbod na Gudanarwa',
  Operations: 'Ayyuka',
  Management: 'Gudanarwa',
  System: 'Tsari',
  'Provision Store': 'Shagon Kaya',
  'POS Banking': 'Bankin POS',
  'Laundry Service': 'Sabis na Wanki',
  'POS Terminal': 'POS Terminal',
  'Sales & Refunds': 'Tarihin Sayarwa',
  'Sales History': 'Tarihin Sayarwa',
  Inventory: 'Ajiyar Kaya',
  Products: 'Kayayyaki',
  Purchases: 'Sayayya',
  Customers: 'Kwastamomi',
  'Credit Ledger': 'Littafin Bashi',
  Ledger: 'Littafin Lissafi',
  Expenses: 'Kashe Kuɗi',
  'Stock & Expiry': 'Kaya da Ƙarewa',
  Reports: 'Rahotanni',
  Transactions: "Mu'amaloli",
  'Cash & Float': 'Kuɗin Hannu da Float',
  Orders: 'Ododi',
  'Staff Management': "Gudanar da Ma'aikata",
  Employees: "Ma'aikata",
  'Roles & Permissions': 'Matsayi da Izini',
  'Audit Log': 'Littafin Bincike',
  'Shop Settings': 'Saitunan Shago',
  Settings: 'Saituna',
  About: 'Game da App',
  'Log Out': 'Fita',
  Dark: 'Duhu',
  Light: 'Haske',
  SuperAdmin: 'Babban Admin',
};

interface AuthState {
  token: string | null;
  session: Session | null;
  tenant: TenantBranding;
  theme: 'light' | 'dark';
  lang: 'en' | 'ha';
  setAuth: (
    token: string,
    session: Session,
    tenant?: TenantBranding | null,
  ) => void;
  setTenant: (tenant: Partial<TenantBranding>) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  logout: () => void;
  canView: (pageKey: string) => boolean;
  canAction: (pageKey: string, action: 'add' | 'edit' | 'delete') => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      session: null,
      tenant: DEFAULT_TENANT,
      theme: 'light',
      lang: 'en',

      setAuth: (token, session, tenant) =>
        set((state) => ({
          token,
          session,
          tenant: tenant ? { ...DEFAULT_TENANT, ...tenant } : state.tenant,
        })),

      setTenant: (updates) =>
        set((state) => ({
          tenant: { ...state.tenant, ...updates },
        })),

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark');
          }
          return { theme: next };
        }),

      toggleLang: () =>
        set((state) => ({
          lang: state.lang === 'en' ? 'ha' : 'en',
        })),

      logout: () => set({ token: null, session: null }),

      canView: (pageKey: string) => {
        const s = get().session;
        if (!s) return false;
        if (s.role === 'Owner' || s.role === 'SuperAdmin') return true;
        if (s.permissions && s.permissions[pageKey]) {
          return s.permissions[pageKey].view !== false;
        }
        return true;
      },

      canAction: (pageKey: string, action: 'add' | 'edit' | 'delete') => {
        const s = get().session;
        if (!s) return false;
        if (s.role === 'Owner' || s.role === 'SuperAdmin') return true;
        if (s.permissions && s.permissions[pageKey]) {
          return Boolean(s.permissions[pageKey][action]);
        }
        return false;
      },
    }),
    {
      name: 'amanahq_auth_v2',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.classList.toggle(
            'dark',
            state.theme === 'dark',
          );
        }
      },
    },
  ),
);

// Helper hook for translations & dynamic currency formatting
// export function useAmanaUI() {
//   const { lang, tenant, theme, toggleTheme, toggleLang } = useAuthStore();
//   const t = (english: string, hausaOverride?: string) => {
//     if (lang !== 'ha') return english;
//     return hausaOverride || HAUSA_DICT[english] || english;
//   };
//   const formatCurrency = (amount: number | string | null | undefined) => {
//     const n = Math.round(Number(amount) || 0);
//     return `${tenant.currencySymbol || '₦'}${n.toLocaleString('en-NG')}`;
//   };
//   return { lang, theme, tenant, t, formatCurrency, toggleTheme, toggleLang };
// }

export function useAmanaUI() {
  const { lang, tenant, theme, toggleTheme, toggleLang } = useAuthStore();
  const safeTenant = tenant || DEFAULT_TENANT;
  const t = (english: string, hausaOverride?: string) => {
    if (lang !== 'ha') return english;
    return hausaOverride || HAUSA_DICT[english] || english;
  };
  const formatCurrency = (amount: number | string | null | undefined) => {
    const n = Math.round(Number(amount) || 0);
    return `${safeTenant.currencySymbol || '₦'}${n.toLocaleString('en-NG')}`;
  };
  return {
    lang,
    theme,
    tenant: safeTenant,
    t,
    formatCurrency,
    toggleTheme,
    toggleLang,
  };
}
