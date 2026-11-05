const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with code ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

// 1. System & Device Telemetry
export const getDeviceStatus = (machineId = "smartvend_01") => fetchJson(`/status?machine_id=${machineId}`);
export const updateDeviceHeartbeat = (data) => fetchJson('/status', { method: 'POST', body: JSON.stringify(data) });
export const setDemoMode = (enabled) => fetchJson(`/settings/demo_mode?enabled=${enabled}`, { method: 'POST' });

// 2. Hardware Dispense & Simulator
export const recordSale = (saleData) => fetchJson('/sales', { method: 'POST', body: JSON.stringify(saleData) });
export const simulateDispense = (slotId, simulateIrSuccess = true) => 
  fetchJson(`/simulate/dispense?slot_id=${slotId}&simulate_ir_success=${simulateIrSuccess}`, { method: 'POST' });

// 3. Products & Inventory
export const getProducts = () => fetchJson('/products');
export const createProduct = (product) => fetchJson('/products', { method: 'POST', body: JSON.stringify(product) });
export const updateProduct = (id, data) => fetchJson(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateStock = (id, data) => fetchJson(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const restockProduct = (data) => fetchJson('/restock', { method: 'POST', body: JSON.stringify(data) });
export const getStockLogs = (productId) => fetchJson(productId ? `/inventory/logs?product_id=${productId}` : '/inventory/logs');

// 4. Sales & Analytics
export const getSalesAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/sales${query ? `?${query}` : ''}`);
};
export const getExportCsvUrl = () => `${API_BASE}/sales/export.csv`;

// 5. AI Demand Forecasting
export const getForecast = () => fetchJson('/forecast');

// 6. Alerts
export const getAlerts = () => fetchJson('/alerts');
export const acknowledgeAlert = (id) => fetchJson(`/alerts/${id}/ack`, { method: 'POST' });
export const deleteAlert = (id) => fetchJson(`/alerts/${id}`, { method: 'DELETE' });

// 7. Global Market Trends
export const getGlobalMarketTrends = () => fetchJson('/market-trends');
