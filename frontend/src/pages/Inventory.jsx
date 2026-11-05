import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Edit, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  TrendingDown, 
  Package, 
  Save, 
  X,
  ArrowUpDown,
  DollarSign
} from 'lucide-react';
import { updateStock, updateProduct, createProduct, getStockLogs } from '../api';

export default function Inventory({ products, onRefresh }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for Edit
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editName, setEditName] = useState('');

  // Form states for Add Product
  const [newProdId, setNewProdId] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newSlotId, setNewSlotId] = useState(1);
  const [newPrice, setNewPrice] = useState(2.00);
  const [newCategory, setNewCategory] = useState('Snacks');
  const [newInitialStock, setNewInitialStock] = useState(20);
  const [newMinStock, setNewMinStock] = useState(4);
  const [newImageUrl, setNewImageUrl] = useState('');

  const openEditModal = (prod) => {
    setSelectedProduct(prod);
    setEditName(prod.product_name);
    setEditPrice(prod.price);
    setEditStock(prod.current_stock);
    setEditMinStock(prod.min_stock || 3);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      // 1. Update product info (name, price)
      await updateProduct(selectedProduct.product_id, {
        product_name: editName,
        price: parseFloat(editPrice)
      });

      // 2. Update stock & min stock
      await updateStock(selectedProduct.product_id, {
        current_stock: parseInt(editStock),
        min_stock: parseInt(editMinStock),
        reason: 'Manual admin adjustment from inventory dashboard'
      });

      setIsEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error updating product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProduct({
        product_id: newProdId || `prod_${Date.now()}`,
        product_name: newProdName,
        price: parseFloat(newPrice),
        category: newCategory,
        slot_id: parseInt(newSlotId),
        initial_stock: parseInt(newInitialStock),
        current_stock: parseInt(newInitialStock),
        min_stock: parseInt(newMinStock),
        image_url: newImageUrl || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80',
        description: 'New vending machine slot product'
      });
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error adding product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openLogsModal = async (prodId = null) => {
    setIsLogsModalOpen(true);
    try {
      const logs = await getStockLogs(prodId);
      setStockLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vending Inventory & Slot Configuration</h2>
          <p className="text-xs text-slate-500">Live hardware-synchronized stock levels with automated dispense decrements</p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => openLogsModal()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail / Logs</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot Product</span>
          </button>
        </div>
      </div>

      {/* 2. INVENTORY OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Items In Machine</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {products?.reduce((acc, p) => acc + (p.current_stock || 0), 0)} units
          </div>
          <span className="text-[11px] text-slate-400">Sum of Slots 1, 2, and 3</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 uppercase">Low Stock Triggers</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {products?.filter(p => p.current_stock <= (p.min_stock || 3) && p.current_stock > 0).length} Slots
          </div>
          <span className="text-[11px] text-amber-700">Threshold: &le; Min Stock parameter</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-rose-600 uppercase">Empty / Depleted</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {products?.filter(p => p.current_stock === 0).length} Slots
          </div>
          <span className="text-[11px] text-rose-700">Servo lockout active until refilled</span>
        </div>
      </div>

      {/* 3. PRIMARY INVENTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900">
            Physical Slot Roster & Inventory Details
          </h3>
          <span className="text-xs text-slate-400">
            Auto-decremented when IR confirms drop
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Initial Stock</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Sold Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products?.map((prod) => {
                const isOutOfStock = prod.current_stock === 0;
                const isLowStock = prod.current_stock <= (prod.min_stock || 3);

                return (
                  <tr key={prod.product_id} className="hover:bg-slate-50 transition-colors">
                    {/* Slot ID */}
                    <td className="py-3 px-4">
                      <span className="w-7 h-7 rounded-lg bg-navy-900 text-white font-bold font-mono text-xs flex items-center justify-center">
                        #{prod.slot_id}
                      </span>
                    </td>

                    {/* Product Name & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={prod.image_url} 
                          alt={prod.product_name} 
                          className="w-10 h-10 object-contain rounded-md bg-slate-100 p-1 border border-slate-200" 
                        />
                        <div>
                          <div className="font-bold text-slate-900">{prod.product_name}</div>
                          <span className="text-[10px] text-slate-400">{prod.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${prod.price?.toFixed(2)}
                    </td>

                    {/* Initial Stock */}
                    <td className="py-3 px-4 font-medium text-slate-500">
                      {prod.initial_stock}
                    </td>

                    {/* Available Stock with progress bar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                          {prod.current_stock}
                        </span>
                        <span className="text-[10px] text-slate-400">(min: {prod.min_stock || 3})</span>
                      </div>
                    </td>

                    {/* Sold Units */}
                    <td className="py-3 px-4 font-semibold text-brand-700">
                      {prod.units_sold ?? 0}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          IN STOCK
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                      >
                        Edit / Refill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: EDIT PRODUCT & REFILL STOCK */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-brand-600" />
                Edit Slot #{selectedProduct.slot_id} ({selectedProduct.product_name})
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price ($ USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Alert Threshold:</label>
                  <input
                    type="number"
                    min="1"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Physical Units:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEditStock(prev => parseInt(prev || 0) + 10)}
                    className="px-3 py-2 bg-brand-50 text-brand-700 font-semibold rounded-lg hover:bg-brand-100 whitespace-nowrap"
                  >
                    +10 Refill
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Changes are saved to SQLite and audit logged.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {loading ? 'Saving Changes...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" />
                Configure New Slot Product
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name:</label>
                <input
                  type="text"
                  placeholder="e.g. KitKat Chunky"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slot Assignment:</label>
                  <select
                    value={newSlotId}
                    onChange={(e) => setNewSlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value={1}>Slot 1 (Servo GPIO 18)</option>
                    <option value={2}>Slot 2 (Servo GPIO 19)</option>
                    <option value={3}>Slot 3 (Servo GPIO 21)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price ($ USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold:</label>
                  <input
                    type="number"
                    min="1"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {loading ? 'Adding...' : 'Add Slot Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: AUDIT TRAIL / STOCK LOGS */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                Physical Inventory Audit Trail
              </h3>
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Change Type</th>
                    <th className="py-2.5 px-3">Delta</th>
                    <th className="py-2.5 px-3">Stock Before &rarr; After</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.product_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.change_type === 'DISPENSE' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {log.change_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {log.previous_stock} &rarr; <strong className="text-slate-900">{log.new_stock}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
