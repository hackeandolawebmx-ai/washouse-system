/**
 * REGISTRO CENTRAL DE LICENCIAS (Control Fundadores)
 * 
 * Este archivo es la única fuente de verdad para el estado de las sucursales.
 * Las modificaciones aquí requieren un despliegue de código, lo que garantiza
 * que el cliente no pueda auto-habilitarse sucursales sin pago.
 */

export const BRANCH_LICENSES = {
    'main': {
        status: 'active',
        expires: '2026-12-31',
        plan: 'Premium'
    },
    'semillero': {
        status: 'active',
        expires: '2026-12-31',
        plan: 'Premium'
    },
    'guadalupe': {
        status: 'active',
        expires: '2026-12-31',
        plan: 'Standard'
    },
    'mitras': {
        status: 'active',
        expires: '2026-12-31',
        plan: 'Standard'
    }
    // Para desactivar una sucursal, cambiar status a 'suspended' o 'pending_payment'
    // O simplemente poner una fecha de 'expires' en el pasado.
};

export const isLicenseValid = (branchId) => {
    const license = BRANCH_LICENSES[branchId];
    if (!license) return false;
    if (license.status !== 'active') return false;

    const expiryDate = new Date(license.expires);
    const now = new Date();
    return expiryDate > now;
};
