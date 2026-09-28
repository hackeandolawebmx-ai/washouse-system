/**
 * Cola de secado.
 *
 * "Lavado y secado" es un proceso secuencial: la ropa se lava y, cuando la
 * lavadora termina, pasa a una secadora. Al registrar la orden la lavadora
 * guarda un `pendingDry` con lo necesario para arrancar el secado después;
 * esta función es la que, cada vez que cambia el estado de los equipos,
 * asigna una secadora libre a cada lavadora que ya terminó y tiene secado
 * pendiente.
 *
 * Es pura (no toca Supabase ni el estado de React) para poder llamarla desde
 * un solo lugar y cubrir todos los caminos por los que una lavadora termina
 * o una secadora se libera: fin del temporizador, "Forzar Terminado",
 * "Liberar Equipo" de una secadora, o salir de mantenimiento.
 */

export const DRY_CYCLE_MINUTES = 30;

const machineNumber = (m) => parseInt(m.name?.match(/\d+/)?.[0] || '0', 10);

/**
 * Prefiere la secadora emparejada por posición con la lavadora (L1→S7, …) si
 * está libre; si no, la primera secadora libre de la sucursal.
 */
function pickDryer(machines, washer) {
    const free = machines
        .filter(m => m.branchId === washer.branchId && m.type === 'secadora' && m.status === 'available')
        .sort((a, b) => machineNumber(a) - machineNumber(b));

    return free.find(d => d.id === washer.pendingDry?.preferredDryerId) || free[0] || null;
}

/**
 * @returns {{ machines: object[], started: object[] }} el nuevo arreglo de
 * equipos y las secadoras que se acaban de arrancar (para persistirlas).
 */
export function assignPendingDries(machines) {
    // Primero la carga que lleva más tiempo esperando.
    const waiting = machines
        .filter(m => m.pendingDry && m.status === 'finished')
        .sort((a, b) => (a.pendingDry.queuedAt || '').localeCompare(b.pendingDry.queuedAt || ''));

    let next = machines;
    const started = [];

    for (const washer of waiting) {
        const dryer = pickDryer(next, washer);
        if (!dryer) break; // no queda ninguna secadora libre para las demás

        const { pendingDry } = washer;
        const startedDryer = {
            ...dryer,
            status: 'running',
            timeLeft: DRY_CYCLE_MINUTES,
            clientName: pendingDry.clientName,
            items: pendingDry.items,
            orderId: pendingDry.orderId,
            total: 0, // ya se cobró completo en la lavadora
            startDate: new Date().toISOString(),
            fromWasherName: washer.name
        };

        next = next.map(m => {
            if (m.id === dryer.id) return startedDryer;
            // La lavadora sigue "terminada" hasta que alguien saque la ropa;
            // movedToDryer le dice al mostrador a cuál secadora pasarla.
            if (m.id === washer.id) return { ...m, pendingDry: null, movedToDryer: dryer.name };
            return m;
        });
        started.push(startedDryer);
    }

    return { machines: next, started };
}
