import { useState, useMemo } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { useStorage } from '../context/StorageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { orderItemsToInvoiceItems } from '../utils/orderPricing';
import Button from '../components/ui/Button';
import NewInvoiceModal from '../components/admin/NewInvoiceModal';
import InvoicePreview from '../components/admin/InvoicePreview';
import { Download, Eye, Trash2, X, FileText, Filter, Send, Inbox, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InvoicesPage() {
  const { invoices, loading, cancelInvoice, deleteInvoice, issueInvoice, invoiceRequests, markInvoiceRequestProcessed, rejectInvoiceRequest } = useInvoice();
  const { user, orders } = useStorage();
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [issuingId, setIssuingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const pendingRequests = useMemo(
    () => invoiceRequests.filter(r => r.status === 'pending'),
    [invoiceRequests]
  );

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Status filter
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;

      // Date filters
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(inv.invoice_date) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59);
        if (new Date(inv.invoice_date) > to) return false;
      }

      // Customer search
      if (searchCustomer && !inv.customer_name.toLowerCase().includes(searchCustomer.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [invoices, filterStatus, filterDateFrom, filterDateTo, searchCustomer]);

  // Stats
  const stats = useMemo(() => {
    const total = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const issued = invoices.filter(i => i.status === 'issued').length;
    const draft = invoices.filter(i => i.status === 'draft').length;
    const cancelled = invoices.filter(i => i.status === 'cancelled').length;

    return { total, issued, draft, cancelled };
  }, [invoices]);

  // Handle delete draft
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta factura borrador?')) return;
    setDeletingId(id);
    try {
      await deleteInvoice(id);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle cancel
  const handleCancel = async (id) => {
    if (!confirm('¿Anular esta factura?')) return;
    setCancelingId(id);
    try {
      await cancelInvoice(id);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCancelingId(null);
    }
  };

  // Handle issue (send CFDI to Facturama)
  const handleIssue = async (id) => {
    if (!confirm('¿Emitir esta factura? Se enviará a Facturama para timbrado SAT.')) return;
    setIssuingId(id);
    try {
      await issueInvoice(id);
    } catch (err) {
      alert('Error al emitir: ' + err.message);
    } finally {
      setIssuingId(null);
    }
  };

  // Handle reject a pending invoice request
  const handleRejectRequest = async (id) => {
    if (!confirm('¿Descartar esta solicitud de factura?')) return;
    setRejectingId(id);
    try {
      await rejectInvoiceRequest(id);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRejectingId(null);
    }
  };

  // Build the NewInvoiceModal orderData for a pending request, from its linked order
  const openRequestAsInvoice = (request) => {
    const order = orders.find(o => o.id === request.order_id);
    if (!order) {
      alert('No se encontró la orden asociada a esta solicitud.');
      return;
    }
    setActiveRequest({
      request,
      orderData: {
        branchId: order.branchId,
        customerName: request.customer_razon_social,
        customerPhone: order.customerPhone,
        items: orderItemsToInvoiceItems(order.items),
        total: order.totalAmount,
        requiresInvoice: order.requiresInvoice
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card p-10 mb-10 relative overflow-hidden group shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-washouse-blue">
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                Gestión de Facturas
              </span>
            </div>
            <h2 className="text-5xl font-black text-washouse-navy font-outfit tracking-tighter">
              Facturación
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Genera, gestiona y emite facturas electrónicas (CFDI)
            </p>
          </div>

          <Button
            variant="primary"
            className="rounded-2xl p-4 px-6 shadow-blue-500/20 shadow-lg"
            onClick={() => setIsNewInvoiceOpen(true)}
          >
            + Nueva Factura Manual
          </Button>
        </div>
      </div>

      {/* Pending Invoice Requests (submitted by customers from /solicitar-factura) */}
      {pendingRequests.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border-amber-100/60 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              <Inbox size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-washouse-navy font-outfit">
              Solicitudes de Factura Pendientes
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
              {pendingRequests.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50"
              >
                <div className="text-sm">
                  <p className="font-black text-washouse-navy">
                    Orden #{(req.order_id || '').split('-')[1] || req.order_id}
                  </p>
                  <p className="text-gray-500">
                    {req.customer_razon_social} · RFC {req.customer_rfc}
                    {req.customer_email ? ` · ${req.customer_email}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(req.created_at).toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    className="rounded-xl px-4 py-2.5 text-xs"
                    onClick={() => openRequestAsInvoice(req)}
                  >
                    <Check size={14} className="mr-1.5" /> Generar Factura
                  </Button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    disabled={rejectingId === req.id}
                    className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-red-500 disabled:opacity-50 border border-transparent hover:border-red-100"
                    title="Descartar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Facturado', value: formatCurrency(stats.total), color: 'blue' },
          { label: 'Emitidas', value: stats.issued, color: 'green' },
          { label: 'Borradores', value: stats.draft, color: 'amber' },
          { label: 'Anuladas', value: stats.cancelled, color: 'red' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`glass-card p-6 rounded-2xl border border-${stat.color}-100/50 shadow-lg`}
          >
            <p className={`text-xs font-black text-${stat.color}-400 uppercase tracking-widest mb-2`}>
              {stat.label}
            </p>
            <p className="text-2xl font-black text-washouse-navy font-outfit">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl space-y-4 border-white/60 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-washouse-blue" />
          <span className="text-sm font-black text-gray-600 uppercase tracking-widest">
            Filtros
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black text-sm focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
          >
            <option value="all">Todos los Estados</option>
            <option value="draft">Borrador</option>
            <option value="issued">Emitida</option>
            <option value="sent_to_sat">Enviada a SAT</option>
            <option value="cancelled">Anulada</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black text-sm focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
            placeholder="Desde"
          />

          {/* Date To */}
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black text-sm focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
            placeholder="Hasta"
          />

          {/* Customer Search */}
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black text-sm focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
          />
        </div>

        {/* Clear Filters */}
        {(filterStatus !== 'all' || filterDateFrom || filterDateTo || searchCustomer) && (
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterDateFrom('');
              setFilterDateTo('');
              setSearchCustomer('');
            }}
            className="text-xs font-black text-washouse-blue uppercase tracking-widest hover:underline"
          >
            ✕ Limpiar Filtros
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="glass-card overflow-hidden border-white/60 shadow-xl">
        <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">
              Listado
            </p>
            <h3 className="text-xl font-black text-washouse-navy font-outfit">
              {filteredInvoices.length} Factura{filteredInvoices.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-washouse-blue">
            <FileText size={20} strokeWidth={2.5} />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <p className="font-bold">Cargando facturas...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
              {searchCustomer || filterStatus !== 'all' ? 'Sin resultados' : 'Sin facturas aún'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Número
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Total
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredInvoices.map((invoice) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-gray-50/80 transition-all duration-300"
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-washouse-blue">
                        #{invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-black text-washouse-navy uppercase tracking-tight">
                          {invoice.customer_name}
                        </p>
                        {invoice.customer_phone && (
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                            {invoice.customer_phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-lg font-black text-washouse-navy font-outfit">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-gray-600">
                        {new Date(invoice.invoice_date).toLocaleDateString('es-MX')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          invoice.status === 'draft'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : invoice.status === 'issued'
                            ? 'bg-blue-50 text-washouse-blue border-blue-100'
                            : invoice.status === 'sent_to_sat'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        {invoice.status === 'draft'
                          ? 'Borrador'
                          : invoice.status === 'issued'
                          ? 'Emitida'
                          : invoice.status === 'sent_to_sat'
                          ? 'En SAT'
                          : 'Anulada'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {/* View */}
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-washouse-blue"
                          title="Ver"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Issue (only draft) */}
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleIssue(invoice.id)}
                            disabled={issuingId === invoice.id}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 disabled:opacity-50"
                            title="Emitir factura (timbrar con Facturama)"
                          >
                            <Send size={16} />
                          </button>
                        )}

                        {/* Delete (only draft) */}
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {/* Cancel (if not already cancelled) */}
                        {invoice.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(invoice.id)}
                            disabled={cancelingId === invoice.id}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors text-orange-500 disabled:opacity-50"
                            title="Anular"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      <NewInvoiceModal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
      />

      {/* Invoice Modal for a pending customer request */}
      {activeRequest && (
        <NewInvoiceModal
          isOpen={!!activeRequest}
          onClose={() => setActiveRequest(null)}
          orderId={activeRequest.request.order_id}
          orderData={activeRequest.orderData}
          initialRfc={activeRequest.request.customer_rfc}
          onInvoiceCreated={async (invoice) => {
            try {
              await markInvoiceRequestProcessed(activeRequest.request.id, invoice?.id);
            } catch (err) {
              console.error('Failed to mark invoice request as processed:', err);
            }
          }}
        />
      )}

      {/* Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-h-[90vh] overflow-y-auto">
            <InvoicePreview
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onPrint={() => {
                window.print();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
