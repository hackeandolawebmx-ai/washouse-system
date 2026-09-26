/**
 * Genera las capturas de pantalla del manual de mostrador.
 *
 *   npm run dev              (en otra terminal, o deja que este script lo detecte)
 *   node scripts/capturas-manual.mjs
 *
 * Las imágenes salen en docs/capturas/.
 *
 * No toca Supabase: todas las llamadas REST y RPC se interceptan y se
 * responden con datos de demostración de la sucursal Vista Hermosa, así que
 * el manual no expone datos de clientes reales y el script se puede correr
 * en cualquier máquina sin credenciales.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.CAPTURA_URL || 'http://localhost:5173';
const OUT = path.resolve('docs/capturas');
const BRANCH = 'vista_hermosa';
const PIN = '4821';

// ---------------------------------------------------------------- datos falsos

const branches = [
    { id: 'main', name: 'Washouse Mitras', address: 'Avenida Hermosillo 3312, Mitras Centro, Monterrey, N.L.' },
    {
        id: BRANCH,
        name: 'Washouse Vista Hermosa',
        address: 'Vista Hermosa, Monterrey, N.L.',
        water_cost_per_cycle: 15,
        electricity_cost_per_cycle: 20,
        gas_cost_per_cycle: 30
    }
];

// 6 lavadoras + 6 secadoras. Dejamos el piso a media mañana: dos ciclos
// corriendo, una secadora esperando a que el cliente saque la ropa y una
// lavadora fuera de servicio, para que el manual explique los cuatro estados.
const machines = [
    { id: 'vh_w1', name: 'W1', type: 'lavadora', status: 'running', time_left: 22 },
    { id: 'vh_w2', name: 'W2', type: 'lavadora', status: 'available', time_left: 0 },
    { id: 'vh_w3', name: 'W3', type: 'lavadora', status: 'available', time_left: 0 },
    { id: 'vh_w4', name: 'W4', type: 'lavadora', status: 'maintenance', time_left: 0 },
    { id: 'vh_w5', name: 'W5', type: 'lavadora', status: 'available', time_left: 0 },
    { id: 'vh_w6', name: 'W6', type: 'lavadora', status: 'available', time_left: 0 },
    { id: 'vh_d7', name: 'D7', type: 'secadora', status: 'running', time_left: 8 },
    { id: 'vh_d8', name: 'D8', type: 'secadora', status: 'finished', time_left: 0 },
    { id: 'vh_d9', name: 'D9', type: 'secadora', status: 'available', time_left: 0 },
    { id: 'vh_d10', name: 'D10', type: 'secadora', status: 'available', time_left: 0 },
    { id: 'vh_d11', name: 'D11', type: 'secadora', status: 'available', time_left: 0 },
    { id: 'vh_d12', name: 'D12', type: 'secadora', status: 'available', time_left: 0 }
].map(m => ({ ...m, branch_id: BRANCH }));

// Nombres y teléfonos inventados, a propósito.
const localMachineState = machines.map(m => ({
    id: m.id,
    branchId: BRANCH,
    name: m.name,
    type: m.type,
    status: m.status,
    timeLeft: m.time_left,
    clientName:
        m.id === 'vh_w1' ? 'Rosa Elena Montoya' :
        m.id === 'vh_d7' ? 'Rosa Elena Montoya (Secado auto)' :
        m.id === 'vh_d8' ? 'Jorge Treviño' : null,
    total: m.id === 'vh_w1' ? 200 : m.id === 'vh_d8' ? 100 : 0,
    startDate: m.status === 'available' || m.status === 'maintenance' ? null : new Date().toISOString(),
    items: null,
    orderId: null
}));

const staff = [
    { id: 'vh_host_1', name: 'Karina Solís', role: 'host', branch_id: BRANCH },
    { id: 'vh_host_2', name: 'Diego Barrera', role: 'host', branch_id: BRANCH },
    { id: 'admin_master', name: 'Admin Principal', role: 'admin', branch_id: 'all' }
];

const inventory = [
    ['detergent_powder', 'Detergente polvo', 50, 10],
    ['detergent_liquid', 'Detergente líquido', 30, 18],
    ['softener', 'Suavizante', 100, 12],
    ['bleach', 'Cloro', 60, 10],
    ['pino', 'Pino', 45, 10],
    ['wipe', 'Toallita', 100, 10],
    ['starch', 'Almidón', 20, 12],
    ['hanger', 'Gancho', 200, 8],
    ['bag', 'Bolsa', 300, 10],
    ['stain_remover', 'Quitamanchas', 20, 18]
].map(([id, name, stock, price]) => ({
    id, branch_id: BRANCH, name, category: 'products', stock, price, metadata: { icon: '🧴', type: 'unit' }
}));

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const orders = [
    {
        id: 'ORD-481207-14', branch_id: BRANCH, customer_name: 'Martha Ibarra', customer_phone: '8111234567',
        machine_id: null, items: [{ serviceId: 'iron_dozen', name: 'Docena', quantity: 2, basePrice: 180, type: 'unit' }],
        total_amount: 360, advance_payment: 180, balance_due: 180, payment_method: 'cash',
        status: 'RECEIVED', status_history: [{ status: 'RECEIVED', timestamp: hoursAgo(3), user: 'Karina Solís' }],
        requires_invoice: false, created_at: hoursAgo(3)
    },
    {
        id: 'ORD-481188-02', branch_id: BRANCH, customer_name: 'Luis Ángel Cavazos', customer_phone: '8119876543',
        machine_id: null, items: [{ serviceId: 'duvet_m', name: 'Edredón matrimonial', quantity: 1, basePrice: 190, type: 'unit' }],
        total_amount: 190, advance_payment: 190, balance_due: 0, payment_method: 'card',
        status: 'RECEIVED', status_history: [{ status: 'RECEIVED', timestamp: hoursAgo(2), user: 'Karina Solís' }],
        requires_invoice: false, created_at: hoursAgo(2)
    },
    {
        id: 'ORD-481042-71', branch_id: BRANCH, customer_name: 'Jorge Treviño', customer_phone: '8112223344',
        machine_id: null, items: [{ serviceId: 'wash_dry', name: 'Lavado y secado', quantity: 6.4, basePrice: 150, type: 'weight', baseKg: 5, extraPrice: 20 }],
        total_amount: 170, advance_payment: 170, balance_due: 0, payment_method: 'cash',
        status: 'COMPLETED', status_history: [
            { status: 'RECEIVED', timestamp: hoursAgo(6), user: 'Karina Solís' },
            { status: 'COMPLETED', timestamp: hoursAgo(1), user: 'Karina Solís' }
        ],
        requires_invoice: false, created_at: hoursAgo(6)
    }
];

// ------------------------------------------------- interceptor de Supabase

const EMPTY = new Set([
    'sales', 'shifts', 'services', 'expenses', 'customer_overrides',
    'activity_logs', 'invoices', 'invoice_requests'
]);

async function mockSupabase(context) {
    await context.route('**/rest/v1/**', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        const seg = url.pathname.split('/').filter(Boolean); // rest, v1, <tabla|rpc>, [fn]
        const target = seg[2];
        const json = (body, status = 200) =>
            route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

        // Escrituras: se aceptan sin guardar nada.
        if (req.method() !== 'GET' && target !== 'rpc') return json([], 201);

        if (target === 'rpc') {
            const fn = seg[3];
            if (fn === 'list_staff') return json(staff);
            if (fn === 'verify_pin') {
                const { p_pin, p_branch_id } = JSON.parse(req.postData() || '{}');
                if (p_pin !== PIN) return json([]);
                const found = staff.filter(s =>
                    s.role === 'host' ? (!p_branch_id || s.branch_id === p_branch_id) : true
                );
                return json(found.slice(0, 1));
            }
            return json([]);
        }

        if (target === 'branches') return json(branches);
        if (target === 'machines') return json(machines);
        if (target === 'inventory') return json(inventory);
        if (target === 'orders') return json(orders);
        if (target === 'system_config') return json([{ key: 'schema_version', value: { version: '2.0.0' } }]);
        if (EMPTY.has(target)) return json([]);
        return json([]);
    });

    // Realtime: cortamos el websocket para que no reintente en el fondo.
    await context.route('**/realtime/v1/**', route => route.abort());
}

// ------------------------------------------------------------------ utilidades

let n = 0;
const shots = [];

async function shot(page, name, note) {
    n += 1;
    const file = `${String(n).padStart(2, '0')}-${name}.png`;
    await page.waitForTimeout(650); // deja asentar las animaciones de Framer Motion
    await page.screenshot({ path: path.join(OUT, file) });
    shots.push({ file, note });
    console.log(`  ✓ ${file}  — ${note}`);
}

// ---------------------------------------------------------------------- run

const run = async () => {
    await mkdir(OUT, { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        locale: 'es-MX',
        timezoneId: 'America/Monterrey'
    });

    await mockSupabase(context);

    await context.addInitScript(([branch, version, machineState, branchList]) => {
        localStorage.setItem('washouse_system_version', version);
        localStorage.setItem('washouse_device_branch', branch);
        localStorage.setItem('washouse_machines', JSON.stringify(machineState));
        localStorage.setItem('washouse_branches', JSON.stringify(branchList));
    }, [BRANCH, '2.0.0', localMachineState, branches.map(b => ({ id: b.id, name: b.name, address: b.address }))]);

    const page = await context.newPage();
    page.on('console', m => m.type() === 'error' && console.log('    [consola]', m.text().slice(0, 140)));

    console.log(`\nCapturando desde ${BASE}\n`);
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // --- Apertura -----------------------------------------------------------
    await page.getByText('Identificación de Personal').waitFor({ timeout: 20_000 });
    await shot(page, 'identificacion', 'Lista de personal al abrir la app');

    await page.getByRole('button', { name: /Karina Solís/ }).click();
    await page.locator('input[type="password"]').fill(PIN);
    await shot(page, 'pin', 'Captura del PIN de 4 dígitos');

    await page.getByRole('button', { name: 'Confirmar Identidad' }).click();
    await page.getByText('Apertura de Caja').waitFor();
    await page.locator('input[type="number"]').fill('1500');
    await shot(page, 'apertura-caja', 'Fondo inicial en efectivo');

    await page.getByRole('button', { name: /Abrir Turno y Comenzar/ }).click();

    // --- Tablero de máquinas ------------------------------------------------
    await page.getByRole('heading', { name: 'Panel de Control' }).waitFor();
    await shot(page, 'tablero-maquinas', 'Tablero con los cuatro estados de equipo');

    // --- Asistente de orden -------------------------------------------------
    await page.getByRole('button', { name: 'Nueva Orden' }).first().click();
    await page.getByText('Datos del Cliente').waitFor();
    await page.locator('input[placeholder="Ej. Juan Pérez"]').fill('Alejandra Ruiz');
    await page.locator('input[placeholder="Ej. 811 123 4567"]').fill('8115558899');
    await shot(page, 'orden-cliente', 'Paso 1 · Datos del cliente');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Seleccionar Servicios').waitFor();
    await page.getByRole('button', { name: /Lavado y secado/ }).first().click();
    await page.getByRole('button', { name: /Pieza/ }).first().click();
    await shot(page, 'orden-servicios', 'Paso 2 · Servicios y resumen de la orden');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Agregar Insumos').waitFor();
    await page.getByRole('button', { name: /Bolsa/ }).first().click();
    await shot(page, 'orden-insumos', 'Paso 3 · Insumos que se lleva el cliente');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Pago y Confirmación').waitFor();
    await shot(page, 'orden-pago', 'Paso 4 · Cobro sin factura');

    await page.getByRole('button', { name: /Requiere factura|Facturación/ }).first().click();
    await shot(page, 'orden-pago-factura', 'Paso 4 · El mismo cobro con IVA agregado por factura');

    await page.getByRole('button', { name: /Registrar Orden/ }).click();
    await page.getByText('¡ORDEN REGISTRADA!').waitFor({ timeout: 15_000 });
    await shot(page, 'orden-registrada', 'Paso 5 · Folio, tickets y aviso por WhatsApp');

    await page.getByRole('button', { name: /Volver al Tablero/ }).click();

    // --- Kanban de encargos -------------------------------------------------
    await page.getByRole('link', { name: /Servicios Programados/ }).click();
    await page.getByRole('heading', { name: 'Servicios Programados' }).waitFor();
    await shot(page, 'servicios-programados', 'Tablero Recibido → Terminado');

    // --- Corte de turno -----------------------------------------------------
    await page.getByTitle('Finalizar Turno').click();
    await page.getByText('Corte de Turno').waitFor();
    await page.locator('input[type="number"]').last().fill('1640');
    await shot(page, 'corte-turno', 'Corte con el efectivo declarado y la diferencia');

    await browser.close();

    console.log(`\n${shots.length} capturas en docs/capturas/\n`);
};

run().catch(err => {
    console.error('\nFalló la captura:', err.message);
    process.exit(1);
});
