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