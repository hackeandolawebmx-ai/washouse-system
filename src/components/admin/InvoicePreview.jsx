import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Printer, FileText } from 'lucide-react';

export default function InvoicePreview({ invoice, onClose, onPrint }) {
  if (!invoice) return null;

  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            Factura Electrónica (CFDI)
          </p>
          <h1 className="text-3xl font-black text-washouse-navy font-outfit">
            WASHOUSE LAVANDERÍA
          </h1>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-washouse-blue">
            #{invoice.invoice_number}
          </p>
          <p className="text-xs font-bold text-gray-500">{invoiceDate}</p>
        </div>
      </div>

      {/* Company Info Placeholder */}
      <div className="mb-8 pb-8 border-b-2 border-gray-200">
        <p className="text-xs font-bold text-gray-500">RFC: [Tu RFC Aquí]</p>
        <p className="text-xs font-bold text-gray-500">Dirección: [Tu Dirección Aquí]</p>
      </div>

      {/* Customer Info */}
      <div className="mb-8 p-4 bg-gray-50 rounded-2xl">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
          Datos del Cliente
        </p>
        <p className="text-sm font-black text-washouse-navy">
          {invoice.customer_name}
        </p>
        {invoice.customer_phone && (
          <p className="text-xs font-bold text-gray-600">
            Tel: {invoice.customer_phone}
          </p>
        )}
        {invoice.customer_rfc && (
          <p className="text-xs font-bold text-gray-600">
            RFC: {invoice.customer_rfc}
          </p>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-black text-gray-600 uppercase text-xs tracking-widest">
                Concepto
              </th>
              <th className="text-center py-2 font-black text-gray-600 uppercase text-xs tracking-widest w-12">
                Qty
              </th>
              <th className="text-right py-2 font-black text-gray-600 uppercase text-xs tracking-widest w-20">
                Precio
              </th>
              <th className="text-right py-2 font-black text-gray-600 uppercase text-xs tracking-widest w-24">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 font-bold text-gray-900">
                  {item.description}
                </td>
                <td className="py-3 text-center font-bold text-gray-700">
                  {item.qty}
                </td>
                <td className="py-3 text-right font-bold text-gray-700">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 text-right font-black text-washouse-navy">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-8 space-y-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex justify-between">
          <span className="font-bold text-gray-700">Subtotal:</span>
          <span className="font-black text-gray-900">
            {formatCurrency(invoice.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-gray-700">IVA (16%):</span>
          <span className="font-black text-washouse-blue">
            {formatCurrency(invoice.iva_amount)}
          </span>
        </div>
        {invoice.discount_amount > 0 && (
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Descuento:</span>
            <span className="font-black text-red-600">
              -{formatCurrency(invoice.discount_amount)}
            </span>
          </div>
        )}
        <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-black text-gray-700 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-3xl font-black text-washouse-navy font-outfit">
            {formatCurrency(invoice.total_amount)}
          </span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-8 text-sm">
        <p className="font-bold text-gray-700">
          Método de Pago: <span className="uppercase font-black text-washouse-navy">
            {invoice.payment_method === 'cash' ? 'Efectivo' :
             invoice.payment_method === 'card' ? 'Tarjeta' :
             invoice.payment_method === 'transfer' ? 'Transferencia' :
             invoice.payment_method === 'check' ? 'Cheque' : invoice.payment_method}
          </span>
        </p>
      </div>

      {/* CFDI Status */}
      {invoice.cfdi_uuid ? (
        <div className="mb-8 p-4 bg-green-50 rounded-2xl border border-green-200">
          <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">
            ✓ CFDI Validado
          </p>
          <p className="text-xs font-mono text-green-700 break-all">
            UUID: {invoice.cfdi_uuid}
          </p>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
            ⚠ CFDI Pendiente
          </p>
          <p className="text-xs font-bold text-amber-700 mt-1">
            Envía a SAT desde Facturación.py
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs font-bold text-gray-500 mb-8 pb-8 border-t border-gray-200">
        <p className="mt-4">Gracias por su compra</p>
        <p>Factura emitida: {invoiceDate}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cerrar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onPrint}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Printer size={18} />
          🖨️ Imprimir
        </Button>
      </div>
    </div>
  );
}
