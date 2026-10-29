import { useAuthStore } from '../store/authStore';

// const API_BASE = 'http://localhost:8787/api';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';
const CACHE_PREFIX = 'amanahq_cache_';
const OUTBOX_KEY = 'amanahq_offline_outbox';

export interface OutboxItem {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  createdAt: string;
  label: string;
}

// Always reads the active user's isolated tenantId from Zustand
function getActiveTenantId(): string {
  try {
    return useAuthStore.getState().session?.tenantId || 'TENANT-001';
  } catch {
    return 'TENANT-001';
  }
}

// Automatically maps each Tenant to its own isolated module partition
function getScopedBranchId(path: string): string | null {
  const tId = getActiveTenantId();
  if (path.startsWith('/provision'))
    return tId === 'TENANT-001' ? 'BR001' : `${tId}_PROV`;
  if (path.startsWith('/banking'))
    return tId === 'TENANT-001' ? 'BR002' : `${tId}_BANK`;
  if (path.startsWith('/laundry'))
    return tId === 'TENANT-001' ? 'BR003' : `${tId}_LAUN`;
  return null;
}

function withScopedBranchUrl(path: string): string {
  const scopedBranch = getScopedBranchId(path);
  if (!scopedBranch) return path;
  const [basePath, queryStr] = path.split('?');
  const params = new URLSearchParams(queryStr || '');
  params.set('branchId', scopedBranch);
  return `${basePath}?${params.toString()}`;
}

export const getOfflineOutbox = (): OutboxItem[] => {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  } catch {
    return [];
  }
};

const addToOfflineOutbox = (
  endpoint: string,
  method: string,
  payload: any,
  label: string,
) => {
  const queue = getOfflineOutbox();
  const scopedBranch = getScopedBranchId(endpoint);
  const item: OutboxItem = {
    id: `OFF-${Date.now().toString(36).toUpperCase()}`,
    endpoint,
    method,
    payload: {
      ...payload,
      tenantId: getActiveTenantId(),
      ...(scopedBranch ? { branchId: scopedBranch } : {}),
    },
    createdAt: new Date().toISOString(),
    label,
  };
  queue.push(item);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('amanahq-outbox-changed'));
  return item;
};

export const syncOfflineOutbox = async (): Promise<{
  synced: number;
  remaining: number;
}> => {
  const queue = getOfflineOutbox();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining: OutboxItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': item.payload?.tenantId || getActiveTenantId(),
        },
        body: JSON.stringify(item.payload),
      });
      const data = await res.json();
      if (data.success) {
        synced++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new Event('amanahq-outbox-changed'));
  return { synced, remaining: remaining.length };
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server error (${response.status}): ${text.slice(0, 120)}`);
  }
}

// Tenant-isolated cached GET helper
async function cachedGet(rawPath: string) {
  const tenantId = getActiveTenantId();
  const path = withScopedBranchUrl(rawPath);
  const cacheKey = `${CACHE_PREFIX}${tenantId}_${path}`;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    const data = await parseJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Request failed');
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data.data));
    } catch {}
    return data.data;
  } catch (err: any) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
}

// Tenant-isolated mutation helper
async function apiMutate(rawPath: string, method: string, body?: any) {
  const tenantId = getActiveTenantId();
  const scopedBranch = getScopedBranchId(rawPath);
  const path = withScopedBranchUrl(rawPath);
  const finalBody = body
    ? {
        ...body,
        tenantId,
        ...(scopedBranch ? { branchId: scopedBranch } : {}),
      }
    : undefined;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
    },
    body: finalBody ? JSON.stringify(finalBody) : undefined,
  });
  const data = await parseJsonResponse(response);
  if (!data.success) throw new Error(data.error || 'Operation failed');
  return data.data;
}

// ============================================================================
// 2. CORE AUTH, BRANDING, RBAC, AUDIT & SUPERADMIN API
// ============================================================================
export const loginApi = (code: string, pin: string) =>
  apiMutate('/login', 'POST', { code, pin });

export const recoverOwnerPin = (
  code: string,
  recoveryKey: string,
  newPin: string,
) => apiMutate('/recover-pin', 'POST', { code, recoveryKey, newPin });

export const getPublicBranding = () => cachedGet('/public-branding');
export const getHomeSummary = () => cachedGet('/home-summary');

export const getEmployees = () => cachedGet('/employees');
export const createEmployee = (payload: any) =>
  apiMutate('/employees', 'POST', payload);
export const updateEmployee = (id: string, payload: any) =>
  apiMutate(`/employees/${id}`, 'PUT', payload);
export const resetEmployeePin = (
  id: string,
  newPin: string,
  actorName?: string,
) => apiMutate(`/employees/${id}/pin`, 'PATCH', { newPin, actorName });
export const setEmployeeStatus = (
  id: string,
  status: string,
  actorName?: string,
) => apiMutate(`/employees/${id}/status`, 'PATCH', { status, actorName });
export const migratePinsToHash = () =>
  apiMutate('/employees/migrate-pins', 'POST');

export const getPermissionMatrix = () => cachedGet('/permissions/matrix');
export const setPermissionCell = (payload: {
  employeeId: string;
  pageKey: string;
  action: 'view' | 'add' | 'edit' | 'delete';
  value: boolean;
  actorName?: string;
}) => apiMutate('/permissions/cell', 'PUT', payload);
export const resetEmployeePermissions = (
  employeeId: string,
  actorName?: string,
) => apiMutate('/permissions/reset', 'POST', { employeeId, actorName });

export const getAuditLogs = () => cachedGet('/audit-logs');

export const getShopSettings = () => cachedGet('/settings');
export const saveShopSettings = (payload: any) =>
  apiMutate('/settings', 'PUT', payload);
export const saveShopLogo = (logoDataUrl: string, actorName?: string) =>
  apiMutate('/settings/logo', 'POST', { logoDataUrl, actorName });

export const getSuperAdminTenants = () => cachedGet('/superadmin/tenants');
export const createSuperAdminTenant = (payload: any) =>
  apiMutate('/superadmin/tenants', 'POST', payload);
export const updateSuperAdminTenant = (id: string, payload: any) =>
  apiMutate(`/superadmin/tenants/${id}`, 'PATCH', payload);
export const updateSuperAdminCredentials = (payload: {
  newCode: string;
  newName: string;
  newPin?: string;
}) => apiMutate('/superadmin/credentials', 'PUT', payload);

// ============================================================================
// 3. PROVISION STORE API
// ============================================================================
export const getProvisionProducts = (branchId = 'BR001') =>
  cachedGet(`/provision/products?branchId=${branchId}`);

export const createProvisionProduct = (productData: any) =>
  apiMutate('/provision/products', 'POST', productData);

export const updateProvisionProduct = (id: string, productData: any) =>
  apiMutate(`/provision/products/${id}`, 'PUT', productData);

export const setProvisionProductStatus = (
  id: string,
  status: 'Active' | 'Inactive',
) => apiMutate(`/provision/products/${id}/status`, 'PATCH', { status });

export const processCheckout = async (checkoutData: any) => {
  try {
    return await apiMutate('/provision/checkout', 'POST', checkoutData);
  } catch (err: any) {
    if (!navigator.onLine || err.message === 'Failed to fetch') {
      const queued = addToOfflineOutbox(
        '/provision/checkout',
        'POST',
        checkoutData,
        `POS Sale ₦${Number(checkoutData?.payment?.totalAmount || 0).toLocaleString()}`,
      );
      return { invoiceNumber: queued.id, queuedOffline: true };
    }
    throw err;
  }
};

export const getProvisionInventory = (branchId = 'BR001') =>
  cachedGet(`/provision/inventory?branchId=${branchId}`);

export const getProvisionPurchases = (branchId = 'BR001') =>
  cachedGet(`/provision/purchases?branchId=${branchId}`);

export const recordPurchase = (purchaseData: any) =>
  apiMutate('/provision/purchases', 'POST', purchaseData);

export const getProvisionCustomers = (branchId = 'BR001') =>
  cachedGet(`/provision/customers?branchId=${branchId}`);

export const createProvisionCustomer = (customerData: {
  branchId: string;
  name: string;
  phone: string;
}) => apiMutate('/provision/customers', 'POST', customerData);

export const getProvisionLedger = (branchId = 'BR001', customerId?: string) => {
  let path = `/provision/ledger?branchId=${branchId}`;
  if (customerId) path += `&customerId=${customerId}`;
  return cachedGet(path);
};

export const recordCustomerPayment = (paymentData: {
  branchId: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  employeeName: string;
}) => apiMutate('/provision/customers/payment', 'POST', paymentData);

export const getProvisionExpenses = (branchId = 'BR001') =>
  cachedGet(`/provision/expenses?branchId=${branchId}`);

export const createProvisionExpense = (expenseData: any) =>
  apiMutate('/provision/expenses', 'POST', expenseData);

export const deleteProvisionExpense = (id: string) =>
  apiMutate(`/provision/expenses/${id}`, 'DELETE');

export const adjustProvisionStock = (adjustData: any) =>
  apiMutate('/provision/stock-adjust', 'POST', adjustData);

export const getProvisionExpiryBatches = (branchId = 'BR001') =>
  cachedGet(`/provision/expiry-batches?branchId=${branchId}`);

export const createProvisionExpiryBatch = (batchData: any) =>
  apiMutate('/provision/expiry-batches', 'POST', batchData);

export const deleteProvisionExpiryBatch = (id: string) =>
  apiMutate(`/provision/expiry-batches/${id}`, 'DELETE');

export const getProvisionDashboard = (branchId = 'BR001') =>
  cachedGet(`/provision/dashboard?branchId=${branchId}`);

export const getProvisionReport = (
  branchId: string,
  startDate: string,
  endDate: string,
) =>
  cachedGet(
    `/provision/reports?branchId=${branchId}&startDate=${startDate}&endDate=${endDate}`,
  );

export const getProvisionSalesHistory = (branchId = 'BR001') =>
  cachedGet(`/provision/sales?branchId=${branchId}`);

export const refundProvisionSale = (
  saleId: string,
  payload: {
    branchId?: string;
    productId: string;
    productName: string;
    quantityPieces: number;
    refundAmount: number;
    reason: string;
    employeeName: string;
  },
) => apiMutate(`/provision/sales/${saleId}/refund`, 'POST', payload);

export const getProvisionDrawer = (branchId = 'BR001') =>
  cachedGet(`/provision/drawer?branchId=${branchId}`);

export const openProvisionDrawer = (payload: {
  branchId?: string;
  openingCash: number;
  employeeName: string;
}) => apiMutate('/provision/drawer/open', 'POST', payload);

export const closeProvisionDrawer = (payload: {
  branchId?: string;
  countedCash: number;
  notes: string;
  employeeName: string;
}) => apiMutate('/provision/drawer/close', 'POST', payload);

// ============================================================================
// 4. POS AGENT BANKING API
// ============================================================================
export const getBankingSettings = (branchId = 'BR002') =>
  cachedGet(`/banking/settings?branchId=${branchId}`);

export const updateBankingChargeDefault = (
  branchId: string,
  transactionType: string,
  defaultCharge: number,
) =>
  apiMutate('/banking/settings/charge', 'PUT', {
    branchId,
    transactionType,
    defaultCharge,
  });

export const addBankingProvider = (branchId: string, providerName: string) =>
  apiMutate('/banking/settings/providers', 'POST', { branchId, providerName });

export const deleteBankingProvider = (id: string) =>
  apiMutate(`/banking/settings/providers/${id}`, 'DELETE');

export const getBankingFloatData = (branchId = 'BR002') =>
  cachedGet(`/banking/float?branchId=${branchId}`);

export const openBankingDay = (payload: {
  branchId: string;
  openingCash: number;
  openingFloat: number;
  employeeName: string;
}) => apiMutate('/banking/float/open', 'POST', payload);

export const closeBankingDay = (payload: {
  branchId: string;
  countedCash: number;
  notes: string;
  employeeName: string;
}) => apiMutate('/banking/float/close', 'POST', payload);

export const reopenBankingDay = (branchId: string) =>
  apiMutate('/banking/float/reopen', 'POST', { branchId });

export const getBankingTransactions = (branchId = 'BR002', date?: string) => {
  let path = `/banking/transactions?branchId=${branchId}`;
  if (date) path += `&date=${date}`;
  return cachedGet(path);
};

export const createBankingTransaction = async (txData: any) => {
  try {
    return await apiMutate('/banking/transactions', 'POST', txData);
  } catch (err: any) {
    if (!navigator.onLine || err.message === 'Failed to fetch') {
      const queued = addToOfflineOutbox(
        '/banking/transactions',
        'POST',
        txData,
        `${txData.type} ₦${Number(txData.amount || 0).toLocaleString()}`,
      );
      return { id: queued.id, transactionCode: queued.id, queuedOffline: true };
    }
    throw err;
  }
};

export const updateBankingTransactionStatus = (
  id: string,
  branchId: string,
  status: string,
  notes?: string,
) =>
  apiMutate(`/banking/transactions/${id}/status`, 'PATCH', {
    branchId,
    status,
    notes,
  });

export const deleteBankingTransaction = (id: string) =>
  apiMutate(`/banking/transactions/${id}`, 'DELETE');

export const getBankingCustomers = (branchId = 'BR002') =>
  cachedGet(`/banking/customers?branchId=${branchId}`);

export const getBankingExpenses = (branchId = 'BR002') =>
  cachedGet(`/banking/expenses?branchId=${branchId}`);

export const createBankingExpense = (expenseData: any) =>
  apiMutate('/banking/expenses', 'POST', expenseData);

export const deleteBankingExpense = (id: string) =>
  apiMutate(`/banking/expenses/${id}`, 'DELETE');

export const getBankingDashboard = (branchId = 'BR002') =>
  cachedGet(`/banking/dashboard?branchId=${branchId}`);

export const getBankingReport = (
  branchId: string,
  startDate: string,
  endDate: string,
) =>
  cachedGet(
    `/banking/reports?branchId=${branchId}&startDate=${startDate}&endDate=${endDate}`,
  );

// ============================================================================
// 5. LAUNDRY SERVICE API
// ============================================================================
export const getLaundrySettings = (branchId = 'BR003') =>
  cachedGet(`/laundry/settings?branchId=${branchId}`);

export const addLaundryItemType = (
  branchId: string,
  itemType: string,
  defaultPrice: number,
  employeeName?: string,
) =>
  apiMutate('/laundry/settings', 'POST', {
    branchId,
    itemType,
    defaultPrice,
    employeeName,
  });

export const updateLaundryItemPrice = (
  id: string,
  defaultPrice: number,
  employeeName?: string,
) =>
  apiMutate(`/laundry/settings/${id}`, 'PUT', { defaultPrice, employeeName });

export const deleteLaundryItemType = (id: string) =>
  apiMutate(`/laundry/settings/${id}`, 'DELETE');

export const getLaundryOrders = (branchId = 'BR003') =>
  cachedGet(`/laundry/orders?branchId=${branchId}`);

export const getLaundryOrderItems = (orderId: string) =>
  cachedGet(`/laundry/orders/${orderId}/items`);

export const createLaundryOrder = (orderData: any) =>
  apiMutate('/laundry/orders', 'POST', orderData);

export const updateLaundryOrderStatus = (
  orderId: string,
  status: string,
  collectedBy?: string,
  employeeName?: string,
) =>
  apiMutate(`/laundry/orders/${orderId}/status`, 'PATCH', {
    status,
    collectedBy,
    employeeName,
  });

export const recordLaundryOrderPayment = (
  orderId: string,
  payload: {
    branchId?: string;
    amount: number;
    paymentMethod: string;
    employeeName?: string;
  },
) => apiMutate(`/laundry/orders/${orderId}/payment`, 'POST', payload);

export const deleteLaundryOrder = (orderId: string) =>
  apiMutate(`/laundry/orders/${orderId}`, 'DELETE');

export const getLaundryCustomers = (branchId = 'BR003') =>
  cachedGet(`/laundry/customers?branchId=${branchId}`);

export const createLaundryCustomer = (payload: {
  branchId?: string;
  name: string;
  phone: string;
}) => apiMutate('/laundry/customers', 'POST', payload);

export const getLaundryLedger = (branchId = 'BR003') =>
  cachedGet(`/laundry/ledger?branchId=${branchId}`);

export const getLaundryExpenses = (branchId = 'BR003') =>
  cachedGet(`/laundry/expenses?branchId=${branchId}`);

export const createLaundryExpense = (payload: any) =>
  apiMutate('/laundry/expenses', 'POST', payload);

export const deleteLaundryExpense = (id: string) =>
  apiMutate(`/laundry/expenses/${id}`, 'DELETE');

export const getLaundryDashboard = (branchId = 'BR003') =>
  cachedGet(`/laundry/dashboard?branchId=${branchId}`);

export const getLaundryReport = (
  branchId: string,
  startDate: string,
  endDate: string,
) =>
  cachedGet(
    `/laundry/reports?branchId=${branchId}&startDate=${startDate}&endDate=${endDate}`,
  );
