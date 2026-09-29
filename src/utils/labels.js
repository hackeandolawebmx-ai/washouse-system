/**
 * Etiquetas en español para valores internos que se guardan en inglés o en
 * mayúsculas (roles, estados, códigos de bitácora).
 *
 * Los valores internos NO se traducen en la base: 'host', 'running',
 * 'COMPLETED' son claves que usa el código y cambiarlas rompería datos ya
 * guardados. Lo que se traduce es cómo se MUESTRAN. Cualquier pantalla que
 * enseñe uno de estos valores debe pasar por aquí.
 */

/** Nombre que queda en bitácora e historial cuando no hay usuario identificado. */
export const USUARIO_MOSTRADOR = 'Mostrador';
export const USUARIO_ADMIN = 'Administrador';

const ROLES = {
    host: 'Operador',
    operator: 'Operador',
    supervisor: 'Supervisor',
    admin: 'Administrador'
};
export const roleLabel = (role) => ROLES[role] || role || '';

const ESTADOS_MAQUINA = {
    available: 'Disponible',
    running: 'En uso',
    finished: 'Terminado',
    maintenance: 'Mantenimiento'
};
export const machineStatusLabel = (status) => ESTADOS_MAQUINA[status] || status || '';

const ESTADOS_ORDEN = {
    RECEIVED: 'Recibido',
    WASHING: 'En máquina',
    DRYING: 'Secando',
    IRONING: 'Planchando',
    COMPLETED: 'Terminado',
    DELIVERED: 'Entregado'
};
export const orderStatusLabel = (status) => ESTADOS_ORDEN[status] || status || '';

// Códigos de bitácora que se guardaron en inglés antes de este cambio. Los
// registros viejos se siguen mostrando en español.
const ACCIONES_LEGADAS = {
    ADMIN_LOGIN: 'ACCESO ADMIN'
};
export const activityLabel = (code = '') =>
    ACCIONES_LEGADAS[code] || code.replaceAll('_', ' ');

// El detalle de la bitácora es texto libre. Los registros guardados antes de
// traducir traen el estado de la orden en inglés ("Orden X a COMPLETED"); se
// traducen al mostrarse, sin reescribir la base.
export const activityDetails = (text = '') =>
    String(text).replace(/\b(RECEIVED|WASHING|DRYING|IRONING|COMPLETED|DELIVERED)\b/g, orderStatusLabel);
