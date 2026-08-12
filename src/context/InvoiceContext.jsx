import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStorage } from './StorageContext';

const InvoiceContext = createContext();

export function InvoiceProvider({ children }) {
  const { selectedBranch, deviceBranchId } = useStorage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all invoices for selected branch
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use deviceBranchId if selectedBranch is 'all' (filter-only mode)
      const branchId = selectedBranch === 'all' ? deviceBranchId : selectedBranch;
      console.log('fetchInvoices: selectedBranch =', selectedBranch, ', using branchId =', branchId);

      const { data, error: err } = await supabase
        .from('invoices')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, deviceBranchId]);

  // Fetch on mount or when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchInvoices();
    }
  }, [selectedBranch, fetchInvoices]);

  // Get next invoice number for branch (RPC call)
  const getNextInvoiceNumber = useCallback(async (branchId) => {
    try {
      const { data, error: err } = await supabase.rpc('get_next_invoice_number', {
        p_branch_id: branchId
      });

      if (err) throw err;
      return data || '000001';
    } catch (err) {
      console.error('Failed to get next invoice number:', err);
      return '000001';
    }
  }, []);

  // Calculate invoice totals (subtotal, iva, total)
  const calculateTotals = useCallback((items, discountAmount = 0) => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const ivaAmount = parseFloat((subtotal * 0.16).toFixed(2)); // IVA 16%
    const totalAmount = parseFloat((subtotal + ivaAmount - discountAmount).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      iva_amount: ivaAmount,
      total_amount: totalAmount
    };
  }, []);

  // Create new invoice (draft)
  const createInvoice = useCallback(async (invoiceData) => {
    try {

      // Get next invoice number
      const nextNumber = await getNextInvoiceNumber(invoiceData.branch_id);

      // Calculate totals
      const totals = calculateTotals(invoiceData.items, invoiceData.discount_amount || 0);

      // Prepare invoice record
      console.log('Creating invoice with branch_id:', invoiceData.branch_id);
      const newInvoice = {
        branch_id: invoiceData.branch_id,
        order_id: invoiceData.order_id || null,
        invoice_number: nextNumber,
        customer_name: invoiceData.customer_name,
        customer_phone: invoiceData.customer_phone || null,
        customer_rfc: invoiceData.customer_rfc || null,
        items: invoiceData.items,
        subtotal: totals.subtotal,
        iva_amount: totals.iva_amount,
        total_amount: totals.total_amount,
        payment_method: invoiceData.payment_method || 'cash',
        discount_amount: invoiceData.discount_amount || 0,
        status: 'draft',
        created_by: invoiceData.created_by || 'system'
      };

      // Insert into Supabase
      const { data, error: err } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select();

      if (err) throw err;

      // Update local state
      if (data && data.length > 0) {
        setInvoices([data[0], ...invoices]);
        return data[0];
      }

      return newInvoice;
    } catch (err) {
      const errorMsg = err.message || 'Failed to create invoice';
      console.error('Create invoice error:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        fullError: err
      });
      setError(errorMsg);
      throw err;
    }
  }, [supabase, invoices, getNextInvoiceNumber, calculateTotals]);

  // Update invoice (only if draft)
  const updateInvoice = useCallback(async (invoiceId, updates) => {
    try {
      setError(null);

      // Get current invoice
      const current = invoices.find(inv => inv.id === invoiceId);
      if (!current) throw new Error('Invoice not found');
      if (current.status !== 'draft') throw new Error('Can only edit draft invoices');

      // Recalculate totals if items or discount changed
      const items = updates.items || current.items;
      const discountAmount = updates.discount_amount !== undefined ? updates.discount_amount : current.discount_amount;
      const totals = calculateTotals(items, discountAmount);

      // Prepare update
      const updateData = {
        ...updates,
        ...totals,
        updated_at: new Date().toISOString()
      };

      // Update in Supabase
      const { data, error: err } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select();

      if (err) throw err;

      // Update local state
      if (data && data.length > 0) {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? data[0] : inv));
        return data[0];
      }

      return { ...current, ...updateData };
    } catch (err) {
      const errorMsg = err.message || 'Failed to update invoice';
      console.error('Update invoice error:', err);
      setError(errorMsg);
      throw err;
    }
  }, [supabase, invoices, calculateTotals]);

  // Issue invoice (draft → issued)
  const issueInvoice = useCallback(async (invoiceId) => {
    try {
      setError(null);

      const { data, error: err } = await supabase
        .from('invoices')
        .update({ status: 'issued', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .select();

      if (err) throw err;

      if (data && data.length > 0) {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? data[0] : inv));
        return data[0];
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to issue invoice';
      console.error('Issue invoice error:', err);
      setError(errorMsg);
      throw err;
    }
  }, [supabase, invoices]);

  // Cancel invoice (any status → cancelled)
  const cancelInvoice = useCallback(async (invoiceId) => {
    try {
      setError(null);

      const { data, error: err } = await supabase
        .from('invoices')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .select();

      if (err) throw err;

      if (data && data.length > 0) {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? data[0] : inv));
        return data[0];
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to cancel invoice';
      console.error('Cancel invoice error:', err);
      setError(errorMsg);
      throw err;
    }
  }, [supabase, invoices]);

  // Delete invoice (only draft)
  const deleteInvoice = useCallback(async (invoiceId) => {
    try {
      setError(null);

      const current = invoices.find(inv => inv.id === invoiceId);
      if (!current) throw new Error('Invoice not found');
      if (current.status !== 'draft') throw new Error('Can only delete draft invoices');

      const { error: err } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (err) throw err;

      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete invoice';
      console.error('Delete invoice error:', err);
      setError(errorMsg);
      throw err;
    }
  }, [supabase, invoices]);

  // Get invoice by ID
  const getInvoiceById = useCallback((invoiceId) => {
    return invoices.find(inv => inv.id === invoiceId);
  }, [invoices]);

  // Get invoices by order ID
  const getInvoicesByOrderId = useCallback((orderId) => {
    return invoices.filter(inv => inv.order_id === orderId);
  }, [invoices]);

  // Get invoices by status
  const getInvoicesByStatus = useCallback((status) => {
    return invoices.filter(inv => inv.status === status);
  }, [invoices]);

  // Search invoices by invoice number
  const searchByInvoiceNumber = useCallback((invoiceNumber) => {
    return invoices.filter(inv => inv.invoice_number.includes(invoiceNumber));
  }, [invoices]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        loading,
        error,
        fetchInvoices,
        createInvoice,
        updateInvoice,
        issueInvoice,
        cancelInvoice,
        deleteInvoice,
        getInvoiceById,
        getInvoicesByOrderId,
        getInvoicesByStatus,
        searchByInvoiceNumber,
        getNextInvoiceNumber,
        calculateTotals
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within InvoiceProvider');
  }
  return context;
}
