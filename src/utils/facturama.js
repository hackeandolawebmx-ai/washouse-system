/**
 * Facturama Integration Service
 * Handles CFDI creation and validation with Facturama API
 */

const FACTURAMA_USER = import.meta.env.VITE_FACTURAMA_USER;
const FACTURAMA_PASSWORD = import.meta.env.VITE_FACTURAMA_PASSWORD;
const FACTURAMA_API_URL = import.meta.env.VITE_FACTURAMA_API_URL;

// Generate HTTP Basic Auth header
function getAuthHeader() {
  const credentials = `${FACTURAMA_USER}:${FACTURAMA_PASSWORD}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
}

/**
 * Create CFDI invoice in Facturama
 * @param {Object} invoiceData - Invoice data with items, customer info, amounts
 * @returns {Promise<Object>} - Response with UUID and CFDI details
 */
export async function createCFDI(invoiceData) {
  try {
    if (!FACTURAMA_USER || !FACTURAMA_PASSWORD) {
      throw new Error('Facturama credentials not configured in .env');
    }

    // Format invoice for Facturama API
    const cfdiPayload = {
      cfdiType: 'Ingreso', // Income invoice
      paymentMethod: mapPaymentMethod(invoiceData.payment_method),
      paymentForm: 'PUE', // Pago Único en Especie (single payment)

      // Issuer (Washouse)
      issuerRfc: invoiceData.issuer_rfc || 'PEND41EAF8FF9', // Default RFC
      issuerName: invoiceData.issuer_name || 'Washouse',
      issuerEmail: invoiceData.issuer_email || 'contact@washouse.com',

      // Receiver (Customer)
      receiverRfc: invoiceData.customer_rfc || 'XAXX010101000', // Generic RFC if not provided
      receiverName: invoiceData.customer_name,

      // Items
      items: invoiceData.items.map(item => ({
        quantity: item.qty || 1,
        description: item.description,
        unitPrice: item.unit_price || 0,
        total: item.total || 0,
        unitCode: 'ACT' // Activity code
      })),

      // Totals
      subtotal: invoiceData.subtotal,
      tax: invoiceData.iva_amount,
      total: invoiceData.total_amount,

      // Discount
      discount: invoiceData.discount_amount || 0,

      // Additional info
      notes: `Pedido: ${invoiceData.order_id || 'Manual'}`,
      internalNumber: invoiceData.invoice_number || ''
    };

    console.log('Sending CFDI to Facturama:', cfdiPayload);

    // Call Facturama API
    const response = await fetch(`${FACTURAMA_API_URL}/3/cfdis`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cfdiPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facturama error ${response.status}: ${error.message || error.error}`);
    }

    const result = await response.json();
    console.log('CFDI created successfully:', result);

    return {
      success: true,
      cfdi_uuid: result.id,
      xml_url: result.xml,
      pdf_url: result.pdf,
      full_response: result
    };
  } catch (err) {
    console.error('Failed to create CFDI in Facturama:', err);
    throw new Error(`Facturama integration error: ${err.message}`);
  }
}

/**
 * Map payment method from our system to Facturama format
 */
function mapPaymentMethod(method) {
  const mapping = {
    'cash': '01',      // Efectivo
    'card': '04',      // Tarjeta de crédito
    'transfer': '02',  // Cheque
    'check': '03'      // Efectivo
  };
  return mapping[method] || '01';
}

/**
 * Download CFDI (factura) from Facturama
 */
export async function downloadCFDI(cfdiId, format = 'pdf') {
  try {
    const response = await fetch(
      `${FACTURAMA_API_URL}/Cfdi/${format}/${cfdiId}`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download CFDI: ${response.statusText}`);
    }

    return await response.blob();
  } catch (err) {
    console.error('Failed to download CFDI:', err);
    throw err;
  }
}

/**
 * Cancel CFDI in Facturama
 */
export async function cancelCFDI(cfdiId, reason = '01') {
  try {
    const response = await fetch(
      `${FACTURAMA_API_URL}/cfdi/${cfdiId}/Cancelation`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellationReason: reason })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel CFDI: ${response.statusText}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to cancel CFDI:', err);
    throw err;
  }
}

export default {
  createCFDI,
  downloadCFDI,
  cancelCFDI
};
