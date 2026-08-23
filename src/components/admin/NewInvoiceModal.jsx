import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { useInvoice } from '../../context/InvoiceContext';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { X } from 'lucide-react';

export default function NewInvoiceModal({ isOpen, onClose, orderId, orderData, initialRfc, onInvoiceCreated }) {
  const { createInvoice, updateInvoice } = useInvoice();
  const { selectedBranch, deviceBranchId, user } = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [customerName, setCustomerName] = useState(orderData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(orderData?.customerPhone || '');
  const [customerRfc, setCustomerRfc] = useState(initialRfc || '');
  const [items, setItems] = useState(orderData?.items || []);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Auto-fill from order if provided
  useEffect(() => {
    if (orderData) {
      setCustomerName(orderData.customerName || '');
      setCustomerPhone(orderData.customerPhone || '');
      setCustomerRfc(initialRfc || '');

      // Convert order items to invoice format
      if (orderData.items && Array.isArray(orderData.items)) {
        const formattedItems = orderData.items.map(item => ({
          description: item.name || item.description || 'Servicio',
          qty: item.qty || 1,
          unit_price: item.price || 0,
          total: (item.qty || 1) * (item.price || 0)
        }));
        setItems(formattedItems);
      }
    }
  }, [orderData, initialRfc, isOpen]);

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
  const ivaAmount = parseFloat((subtotal * 0.16).toFixed(2));
  const totalAmount = parseFloat((subtotal + ivaAmount - discountAmount).toFixed(2));

  // Handle add item
  const handleAddItem = () => {
    setItems([
      ...items,
      { description: '', qty: 1, unit_price: 0, total: 0 }
    ]);
  };

  // Handle update item
  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total
    if (field === 'qty' || field === 'unit_price') {
      const qty = parseFloat(newItems[index].qty) || 0;
      const price = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total = parseFloat((qty * price).toFixed(2));
    }

    setItems(newItems);
  };

  // Handle remove item
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }
    if (items.length === 0) {
      setError('Debe agregar al menos un concepto');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      setError('Todos los conceptos deben tener descripción');
      return;
    }

    setLoading(true);
    try {
      // The order's own branch is the authoritative source when known (e.g. reviewing
      // a request for an order from a different branch than the admin's current filter).
      // Otherwise fall back to deviceBranchId if selectedBranch is 'all' (filter-only mode).
      const branchId = orderData?.branchId || (selectedBranch === 'all' ? deviceBranchId : selectedBranch);

      const invoiceData = {
        branch_id: branchId,
        order_id: orderId || null,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_rfc: customerRfc || null,
        items: items,
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        created_by: user?.name || 'system'
      };

      const created = await createInvoice(invoiceData);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerRfc('');
      setItems([]);
      setPaymentMethod('cash');
      setDiscountAmount(0);

      if (onInvoiceCreated) onInvoiceCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al generar la factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                    Nuevo Comprobante
                  </p>
                  <h2 className="text-2xl font-black text-washouse-navy font-outfit">
                    Generar Factura
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Error Alert */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm font-bold text-red-600">{error}</p>
                  </div>
                )}

                {/* Cliente Section */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Datos del Cliente
                  </p>

                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black uppercase tracking-widest focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Teléfono (opcional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black uppercase tracking-widest focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      placeholder="RFC (opcional)"
                      value={customerRfc}
                      onChange={(e) => setCustomerRfc(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black uppercase tracking-widest focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Conceptos
                    </p>
                    <Button variant="ghost" size="sm" type="button" onClick={handleAddItem}>
                      + Agregar Concepto
                    </Button>
                  </div>

                  {items.length === 0 ? (
                    <p className="p-4 text-center text-gray-400 font-bold">
                      Sin conceptos aún. Agrega al menos uno.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                          <input
                            type="text"
                            placeholder="Descripción del concepto"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold focus:ring-2 focus:ring-washouse-blue focus:border-transparent"
                          />
                          <div className="grid grid-cols-12 gap-2">
                            {/* Cantidad */}
                            <div className="col-span-2">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Cantidad
                              </label>
                              <input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={item.qty}
                                onChange={(e) => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold focus:ring-2 focus:ring-washouse-blue focus:border-transparent"
                              />
                            </div>

                            {/* Precio Unitario */}
                            <div className="col-span-3">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Precio Unitario
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold focus:ring-2 focus:ring-washouse-blue focus:border-transparent"
                              />
                            </div>

                            {/* Total */}
                            <div className="col-span-3">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Total
                              </label>
                              <div className="px-2 py-2 bg-blue-50 rounded-lg text-sm font-bold text-washouse-blue text-right">
                                {formatCurrency(item.total)}
                              </div>
                            </div>

                            {/* Quitar */}
                            <div className="col-span-4 flex items-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="w-full px-2 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-black text-red-600 transition-colors"
                              >
                                ✕ Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600">Subtotal:</span>
                    <span className="text-lg font-black text-washouse-navy">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600">IVA (16%):</span>
                    <span className="text-lg font-black text-washouse-blue">{formatCurrency(ivaAmount)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">Descuento:</span>
                      <span className="text-lg font-black text-red-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-widest text-gray-700">Total:</span>
                    <span className="text-3xl font-black text-washouse-navy font-outfit">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Discount & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Descuento ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                      <option value="check">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="flex-1"
                  >
                    {loading ? 'Generando...' : '💾 Generar Factura'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
