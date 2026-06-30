const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Thin fetch wrapper that normalizes error handling across the app.
 * Throws an Error with a readable message on non-2xx responses so callers
 * can rely on a single try/catch pattern.
 */
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Response had no JSON body (e.g. network-level failure already handled by fetch throwing)
  }

  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function fetchOrders({ status, search, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', limit);

  return request(`/orders?${params.toString()}`);
}

export function fetchOrderById(orderId) {
  return request(`/orders/${orderId}`);
}

export function createOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateOrder(orderId, payload) {
  return request(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchSchedulerLogs({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  return request(`/scheduler/logs?${params.toString()}`);
}
