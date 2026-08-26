import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStorage } from './StorageContext';
import { createCFDI, downloadCFDI } from '../utils/facturama';

const InvoiceContext = createContext();

export function InvoiceProvider({ children }) {
  const { selectedBranch, deviceBranchId, taxConfig } = useStorage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceRequests, setInvoiceRequests] = useState([]);

  // Fetch invoices — 'all' means every branch, matching the convention
  // used across ClientsPage/ReportsPage/AdminDashboard/useMetrics.
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  // Fetch on mount or when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchInvoices();
    }
  }, [selectedBranch, fetchInvoices]);

  // Self-service invoice requests, submitted by customers from the public
  // /solicitar-factura page and reviewed by staff in the admin Facturación queue.
  const fetchInvoiceRequests = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('invoice_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setInvoiceRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch invoice requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchInvoiceRequests();
  }, [fetchInvoiceRequests]);

  // Public: customer submits a request from their ticket folio (no auth required)
  const submitInvoiceRequest = useCallback(async ({ orderId, branchId, rfc, razonSocial, email }) => {
    const { data, error: err } = await supabase
      .from('invoice_requests')
      .insert([{
        order_id: orderId,
        branch_id: branchId || null,
        customer_rfc: rfc,
        customer_razon_social: razonSocial,
        customer_email: email || null
      }])
      .select();

    if (err) throw err;
    return data?.[0];
  }, []);

  // Staff: mark a request as processed once its invoice has been generated
  const markInvoiceRequestProcessed = useCallback(async (requestId, invoiceId) => {
    const { data, error: err } = await supabase
      .from('invoice_requests')
      .update({ status: 'processed', invoice_id: invoiceId || null, processed_at: new Date().toISOString() })
      .eq('id', requestId)
      .select();

    if (err) throw err;
    if (data && data.length > 0) {
      setInvoiceRequests(prev => prev.map(r => r.id === requestId ? data[0] : r));
    }
  }, []);

  // Staff: dismiss a request without generating an invoice
  const rejectInvoiceRequest = useCallback(async (requestId) => {
    const { data, error: err } = await supabase
      .from('invoice_requests')
      .update({ status: 'rejected', processed_at: new Date().toISOString() })
      .eq('id', requestId)
      .select();

    if (err) throw err;
    if (data && data.length > 0) {
      setInvoiceRequests(prev => prev.map(r => r.id === requestId ? data[0] : r));
    }
  }, []);

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

  // Calculate invoice totals (subtotal, iva, total).
  //
  // taxIncluded=false: the line totals are pre-tax, so IVA is added on top.
  // taxIncluded=true:  the line totals are what was already collected from the
  //                    customer (IVA inside), so the tax is broken out backwards
  //                    — otherwise the CFDI total wouldn't match the money taken.
  const calculateTotals = useCallback((items, discountAmount = 0, options = {}) => {
    const rate = options.rate ?? taxConfig.rate;
    const taxIncluded = options.taxIncluded ?? (taxConfig.mode === 'included');
    const gross = items.reduce((acc, item) => acc + (item.total || 0), 0);

    if (taxIncluded) {
      const subtotal = parseFloat((gross / (1 + rate)).toFixed(2));
      return {
        subtotal,
        iva_amount: parseFloat((gross - subtotal).toFixed(2)),
        total_amount: parseFloat((gross - discountAmount).toFixed(2))
      };
    }

    const subtotal = parseFloat(gross.toFixed(2));
    const ivaAmount = parseFloat((subtotal * rate).toFixed(2));
    return {
      subtotal,
      iva_amount: ivaAmount,
      total_amount: parseFloat((subtotal + ivaAmount - discountAmount).toFixed(2))
    };
  }, [taxConfig]);

  // Create new invoice (draft)
  const createInvoice = useCallback(async (invoiceData) => {
    try {

      // Get next invoice number
      const nextNumber = await getNextInvoiceNumber(invoiceData.branch_id);

      // Calculate totals
      const totals = calculateTotals(invoiceData.items, invoiceData.discount_amount || 0, {
        taxIncluded: invoiceData.tax_included
      });

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
  // Sends CFDI to Facturama for validation
  const issueInvoice = useCallback(async (invoiceId) => {
    try {
      setError(null);

      // Get invoice from local state
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      console.log('Issuing invoice to Facturama:', invoice);

      // Send to Facturama for CFDI validation
      const cfdiResult = await createCFDI({
        invoice_number: invoice.invoice_number,
        order_id: invoice.order_id,
        customer_name: invoice.customer_name,
        customer_rfc: invoice.customer_rfc,
        payment_method: invoice.payment_method,
        items: invoice.items,
        subtotal: invoice.subtotal,
        iva_amount: invoice.iva_amount,
        total_amount: invoice.total_amount,
        discount_amount: invoice.discount_amount
      });

      // Update invoice with CFDI UUID
      const { data, error: err } = await supabase
        .from('invoices')
        .update({
          status: 'issued',
          cfdi_uuid: cfdiResult.cfdi_uuid,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select();

      if (err) throw err;

      console.log('Invoice issued with CFDI UUID:', cfdiResult.cfdi_uuid);

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
  }, [invoices]);

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
        calculateTotals,
        invoiceRequests,
        fetchInvoiceRequests,
        submitInvoiceRequest,
        markInvoiceRequestProcessed,
        rejectInvoiceRequest
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
