/**
 * Acceso a datos de las páginas públicas (landing y facturación).
 *
 * Deliberadamente no usa ningún contexto de la app: las rutas
 * públicas no montan StorageProvider, así que un visitante nunca
 * descarga órdenes, clientes ni inventario a su navegador.
 *
 * Todo lo que necesite una página pública se pide por aquí, y solo
 * contra vistas públicas o funciones acotadas — nunca contra las
 * tablas de la operación.
 */

import { supabase } from './supabase';

/** El ticket imprime el bloque de en medio de 'ORD-481207-14'. */
export const folioCorto = (orderId) => (orderId ? orderId.split('-')[1] || orderId : '');

/**
 * Busca una orden por folio para el flujo de facturación.
 * Devuelve null si no existe. El nombre del cliente llega
 * enmascarado desde la base.
 */
export async function buscarOrdenPorFolio(folio) {
    const limpio = String(folio).trim().replace(/^#/, '');
    if (!limpio) return null;

    const { data, error } = await supabase.rpc('buscar_orden_para_factura', { p_folio: limpio });
    if (error) throw error;

    const fila = data?.[0];
    if (!fila) return null;

    return {
        id: fila.id,
        branchId: fila.branch_id,
        branchName: fila.branch_name,
        customerLabel: fila.customer_label,
        totalAmount: fila.total_amount,
        createdAt: fila.created_at
    };
}

/** Sucursales abiertas al público, con sus datos de contacto. */
export async function obtenerSucursalesPublicas() {
    const { data, error } = await supabase
        .from('public_branches')
        .select('*')
        .order('name');

    if (error) throw error;
    return (data || []).map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        hours: b.hours,
        mapsUrl: b.maps_url
    }));
}

/** Catálogo de servicios con precios, tal como los cobra el mostrador. */
export async function obtenerServiciosPublicos() {
    const { data, error } = await supabase
        .from('public_services')
        .select('*');

    if (error) throw error;
    return (data || []).map(s => ({
        ...s.metadata,
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price
    }));
}

/** Registra la solicitud de factura para que administración la timbre. */
export async function enviarSolicitudFactura({ orderId, branchId, rfc, razonSocial, email }) {
    const { data, error } = await supabase
        .from('invoice_requests')
        .insert([{
            order_id: orderId,
            branch_id: branchId || null,
            customer_rfc: rfc,
            customer_razon_social: razonSocial,
            customer_email: email || null
        }])
        .select();

    if (error) throw error;
    return data?.[0];
}
