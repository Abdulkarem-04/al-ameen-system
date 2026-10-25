const API_BASE = 'http://localhost:8787/api';

export const loginApi = async (code: string, pin: string) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, pin }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data.data; // Returns { token, session }
};

export const getProvisionProducts = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/products?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const createProvisionProduct = async (productData: any) => {
  const response = await fetch(`${API_BASE}/provision/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const processCheckout = async (checkoutData: any) => {
  const response = await fetch(`${API_BASE}/provision/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionInventory = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/inventory?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const recordPurchase = async (purchaseData: any) => {
  const response = await fetch(`${API_BASE}/provision/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionPurchases = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/purchases?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionCustomers = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/customers?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const createProvisionCustomer = async (customerData: {
  branchId: string;
  name: string;
  phone: string;
}) => {
  const response = await fetch(`${API_BASE}/provision/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionLedger = async (
  branchId: string,
  customerId?: string,
) => {
  let url = `${API_BASE}/provision/ledger?branchId=${branchId}`;
  if (customerId) url += `&customerId=${customerId}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const recordCustomerPayment = async (paymentData: {
  branchId: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  employeeName: string;
}) => {
  const response = await fetch(`${API_BASE}/provision/customers/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const updateProvisionProduct = async (id: string, productData: any) => {
  const response = await fetch(`${API_BASE}/provision/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const setProvisionProductStatus = async (
  id: string,
  status: 'Active' | 'Inactive',
) => {
  const response = await fetch(`${API_BASE}/provision/products/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionExpenses = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/expenses?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const createProvisionExpense = async (expenseData: any) => {
  const response = await fetch(`${API_BASE}/provision/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const deleteProvisionExpense = async (id: string) => {
  const response = await fetch(`${API_BASE}/provision/expenses/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const adjustProvisionStock = async (adjustData: any) => {
  const response = await fetch(`${API_BASE}/provision/stock-adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionExpiryBatches = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/expiry-batches?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const createProvisionExpiryBatch = async (batchData: any) => {
  const response = await fetch(`${API_BASE}/provision/expiry-batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const deleteProvisionExpiryBatch = async (id: string) => {
  const response = await fetch(`${API_BASE}/provision/expiry-batches/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionDashboard = async (branchId: string) => {
  const response = await fetch(
    `${API_BASE}/provision/dashboard?branchId=${branchId}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const getProvisionReport = async (
  branchId: string,
  startDate: string,
  endDate: string,
) => {
  const response = await fetch(
    `${API_BASE}/provision/reports?branchId=${branchId}&startDate=${startDate}&endDate=${endDate}`,
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};