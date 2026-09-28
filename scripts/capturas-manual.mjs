/**
 * Genera las capturas de los manuales que viven dentro de la app:
 *   /sucursal/manual  →  public/manual/sucursal/*.png
 *   /admin/manual     →  public/manual/admin/*.png
 *
 *   npm run dev -- --port 5180 --strictPort    (en otra terminal)
 *   node scripts/capturas-manual.mjs           (ambos manuales)
 *   node scripts/capturas-manual.mjs sucursal  (solo uno)
 *
 * No toca Supabase: todas las llamadas REST y RPC se interceptan y se
 * responden con datos inventados de la sucursal Vista Hermosa, así que el
 * manual no expone clientes reales y el script corre sin credenciales.
 *
 * Si cambia una pantalla, se corre de nuevo y las imágenes se actualizan;
 * los textos del manual viven en src/data/manuals/.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.CAPTURA_URL || 'http://localhost:5180';
const SOLO = process.argv[2]; // 'sucursal' | 'admin' | undefined
const BRANCH = 'vista_hermosa';
const HOST_PIN = '4821';
const ADMIN_PIN = '7310';
const VIEWPORT = { width: 1280, height: 800 };

// ============================================================ datos falsos

const ahora = Date.now();
const hace = (min) => new Date(ahora - min * 60_000).toISOString();

const branches = [
    { id: BRANCH, name: 'Washouse Vista Hermosa', address: '4a. Avenida 105, Col. Cumbres, 64610 Monterrey, N.L.', water_cost_per_cycle: 15, electricity_cost_per_cycle: 20, gas_cost_per_cycle: 30 },
    { id: 'main', name: '— No usar · respaldo del sistema —', address: 'Renglón técnico', water_cost_per_cycle: 15, electricity_cost_per_cycle: 20, gas_cost_per_cycle: 30 }
];

const staff = [
    { id: 'vh_host_1', name: 'Angie', role: 'host', branch_id: BRANCH },
    { id: 'vh_host_2', name: 'Diego Barrera', role: 'host', branch_id: BRANCH },
    { id: 'admin_master', name: 'Admin Principal', role: 'admin', branch_id: 'all' }
];

// A media mañana: dos ciclos corriendo, una secadora con ropa esperando a
// que la saquen y una lavadora en mantenimiento — los cuatro estados.
const mkMachine = (n, type, status = 'available', time_left = 0) =>
    ({ id: `vh_${n.toLowerCase()}`, branch_id: BRANCH, name: n, type, status, time_left });
const machines = [
    mkMachine('L1', 'lavadora', 'running', 22), mkMachine('L2', 'lavadora'), mkMachine('L3', 'lavadora'),
    mkMachine('L4', 'lavadora', 'maintenance'), mkMachine('L5', 'lavadora'), mkMachine('L6', 'lavadora'),
    mkMachine('S7', 'secadora', 'running', 8), mkMachine('S8', 'secadora', 'finished'), mkMachine('S9', 'secadora'),
    mkMachine('S10', 'secadora'), mkMachine('S11', 'secadora'), mkMachine('S12', 'secadora')
];
const localMachineState = machines.map(m => ({
    id: m.id, branchId: BRANCH, name: m.name, type: m.type, status: m.status, timeLeft: m.time_left,
    clientName: m.id === 'vh_w1' ? 'Rosa Elena Montoya' : m.id === 'vh_d7' ? 'Luis Cavazos' : m.id === 'vh_d8' ? 'Jorge Treviño' : null,
    pendingDry: m.id === 'vh_w1' ? { clientName: 'Rosa Elena Montoya', items: [], orderId: 'ORD-481301-10', preferredDryerId: 'vh_d7', queuedAt: hace(23) } : null
}));

const inventory = [
    ['detergent_powder', 'Detergente polvo', 48, 10], ['detergent_liquid', 'Detergente líquido', 27, 18],
    ['softener', 'Suavizante', 94, 12], ['bleach', 'Cloro', 60, 10], ['pino', 'Pino', 45, 10],
    ['wipe', 'Toallita', 100, 10], ['starch', 'Almidón', 18, 12], ['hanger', 'Gancho', 196, 8],
    ['bag', 'Bolsa', 288, 10], ['stain_remover', 'Quitamanchas', 19, 18]
].map(([id, name, stock, price]) => ({
    id: `${id}__${BRANCH}`, branch_id: BRANCH, catalog_id: id, name, category: 'products', stock, price, metadata: { icon: '🧴' }
}));

const clientes = [
    ['Martha Ibarra', '8111234567'], ['Luis Ángel Cavazos', '8119876543'], ['Jorge Treviño', '8112223344'],
    ['Rosa Elena Montoya', '8114445566'], ['Paola Garza', '8117778899'], ['Ricardo Salinas', '8113332211'],
    ['Daniela Villarreal', '8116665544'], ['Héctor Leal', '8118887766']
];
const servicios = [['wash_dry', 'Lavado y secado', 150, 'weight'], ['iron_dozen', 'Docena', 180, 'unit'], ['duvet_m', 'Edredón matrimonial', 190, 'unit'], ['self_wash', 'Lavadora', 50, 'weight'], ['fix_hem', 'Bastilla', 80, 'unit']];

const orders = [];
const sales = [];
for (let i = 0; i < 26; i++) {
    const [name, phone] = clientes[i % clientes.length];
    const [sid, sname, price, type] = servicios[i % servicios.length];
    const min = 60 * 24 * 7 - i * 380; // repartidas en la última semana
    const pagado = i % 5 === 0 ? price / 2 : price;
    const id = `ORD-${480100 + i * 37}-${10 + (i % 80)}`;
    orders.push({
        id, branch_id: BRANCH, customer_name: name, customer_phone: phone, machine_id: null,
        items: [{ serviceId: sid, name: sname, quantity: 1, basePrice: price, type }],
        total_amount: price, advance_payment: pagado, balance_due: price - pagado, payment_method: i % 3 ? 'cash' : 'card',
        status: i > 21 ? 'RECEIVED' : 'COMPLETED',
        status_history: [{ status: 'RECEIVED', timestamp: hace(min), user: i % 2 ? 'Angie' : 'Diego Barrera' }],
        requires_invoice: i === 24, created_at: hace(min)
    });
    sales.push({
        id: `S-${i}`, branch_id: BRANCH, shift_id: null, type: 'service_advance', description: `Anticipo Orden ${id}`,
        amount: pagado, order_id: id, method: i % 3 ? 'cash' : 'card',
        machine_id: i % 2 ? `vh_w${(i % 6) + 1}` : null, machine_type: i % 2 ? 'lavadora' : 'N/A', date: hace(min)
    });
}

const shifts = [0, 1, 2, 3, 4].map(d => ({
    id: `SH-${d}`, branch_id: BRANCH, start_time: hace(60 * 24 * (d + 1) + 600), ended_at: hace(60 * 24 * (d + 1)),
    initial_cash: 1500, total_sales: 1840 - d * 135, status: 'closed', closed_by: d % 2 ? 'Diego Barrera' : 'Angie'
}));

const activity = [
    ['TURNO_CERRADO', 'Corte con diferencia de $0.00', 'Angie', 40], ['ORDEN_CREADA', 'Orden ORD-481301-10 recibida', 'Angie', 95],
    ['GASTO_REGISTRADO', 'Gasto: $80 - Compra de bolsas', 'Angie', 130], ['ORDEN_ACTUALIZADA', 'Orden ORD-480100-10 a COMPLETED', 'Diego Barrera', 300],
    ['ADMIN_LOGIN', 'Acceso Administrador: Admin Principal', 'Admin Principal', 420], ['TURNO_ABIERTO', 'Fondo inicial $1,500.00', 'Angie', 610]
].map(([action, details, user, min], i) => ({ id: i + 1, action, details, user_name: user, branch_id: BRANCH, timestamp: hace(min) }));

const invoiceRequests = [{
    id: 'REQ-1', order_id: orders[24].id, branch_id: BRANCH, customer_rfc: 'GAPA850312K21',
    customer_razon_social: 'Paola Garza Alanís', customer_email: 'paola.garza@correo.mx', status: 'pending', created_at: hace(50)
}];
const invoices = [
    { id: 'INV-1', invoice_number: 'A-0012', branch_id: BRANCH, customer_name: 'Comercializadora del Norte SA de CV', customer_phone: '8110001122', total_amount: 1392, status: 'emitida', invoice_date: hace(60 * 30), items: [] },
    { id: 'INV-2', invoice_number: 'A-0013', branch_id: BRANCH, customer_name: 'Héctor Leal Tamez', customer_phone: '8118887766', total_amount: 220.4, status: 'borrador', invoice_date: hace(60 * 5), items: [] }
];

const overrides = clientes.slice(0, 4).map(([name, phone], i) => ({
    phone, registration_branch_id: BRANCH, data: i === 0 ? { notes: 'Prefiere suavizante aparte' } : {}
}));

// ============================================================ interceptor

async function mockSupabase(ctx) {
    await ctx.route('**/rest/v1/**', route => {
        const req = route.request();
        const seg = new URL(req.url()).pathname.split('/').filter(Boolean);
        const t = seg[2];
        const json = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });

        if (req.method() !== 'GET' && t !== 'rpc') return json([], 201);
        if (t === 'rpc') {
            const fn = seg[3];
            if (fn === 'list_staff') return json(staff);
            if (fn === 'verify_pin') {
                const { p_pin, p_branch_id } = JSON.parse(req.postData() || '{}');
                if (!p_branch_id && p_pin === ADMIN_PIN) return json([staff[2]]);
                if (p_branch_id && p_pin === HOST_PIN) return json([staff[0]]);
                return json([]);
            }
            return json([]);
        }
        const tablas = {
            branches, machines, inventory, orders, sales, shifts, staff,
            activity_logs: activity, invoice_requests: invoiceRequests, invoices,
            customer_overrides: overrides,
            system_config: [{ key: 'schema_version', value: { version: '2.0.0' } }]
        };
        return json(tablas[t] || []);
    });
    await ctx.route('**/realtime/v1/**', route => route.abort());
}

// ============================================================ utilidades

let outDir = '';
const hechas = [];
async function shot(page, name, { clip } = {}) {
    await page.waitForTimeout(700); // deja asentar las animaciones
    const file = path.join(outDir, `${name}.png`);
    if (clip) await page.screenshot({ path: file, clip, fullPage: true });
    else await page.screenshot({ path: file });
    hechas.push(file);
    console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
}

async function nuevoContexto(browser, init) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'es-MX', timezoneId: 'America/Monterrey' });
    await mockSupabase(ctx);
    await ctx.addInitScript(init.fn, init.args);
    const page = await ctx.newPage();
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => console.log('    [pageerror]', e.message.slice(0, 140)));
    return { ctx, page };
}

const tarjeta = (page, name) =>
    page.locator('article', { has: page.getByRole('heading', { name, exact: true }) });

// ============================================================ sucursal

async function manualSucursal(browser) {
    outDir = path.resolve('public/manual/sucursal');
    await mkdir(outDir, { recursive: true });
    console.log('\nSucursal');

    const { ctx, page } = await nuevoContexto(browser, {
        fn: ([b, ms]) => {
            localStorage.setItem('washouse_system_version', '2.0.0');
            localStorage.setItem('washouse_device_branch', b);
            localStorage.setItem('washouse_machines', JSON.stringify(ms));
        },
        args: [BRANCH, localMachineState]
    });

    await page.goto(`${BASE}/sucursal`, { waitUntil: 'networkidle' });
    await page.getByText('Identificación de Personal').waitFor({ timeout: 20_000 });
    await shot(page, 'identificacion');

    await page.getByRole('button', { name: /Angie/ }).click();
    await page.locator('input[type="password"]').fill(HOST_PIN);
    await page.getByRole('button', { name: 'Confirmar Identidad' }).click();
    await page.getByText('Apertura de Caja').waitFor();
    await page.locator('input[type="number"]').fill('1500');
    await shot(page, 'apertura-caja');
    await page.getByRole('button', { name: /Abrir Turno y Comenzar/ }).click();

    await page.getByRole('heading', { name: 'Lavadoras' }).waitFor();
    await shot(page, 'tablero');

    // --- Orden de mostrador completa
    await page.getByRole('button', { name: 'Nueva Orden' }).first().click();
    await page.getByText('Datos del Cliente').waitFor();
    await page.locator('input[placeholder="Ej. Juan Pérez"]').fill('Alejandra Ruiz');
    await page.locator('input[placeholder="Ej. 811 123 4567"]').fill('8115558899');
    await shot(page, 'orden-cliente');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Seleccionar Servicios').waitFor();
    await page.getByRole('button', { name: /Lavado y secado/ }).first().click();
    await page.getByRole('button', { name: /Pieza/ }).first().click();
    await shot(page, 'orden-servicios');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Agregar Insumos').waitFor();
    await page.getByRole('button', { name: /Bolsa/ }).first().click();
    await shot(page, 'orden-insumos');

    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByText('Pago y Confirmación').waitFor();
    await shot(page, 'orden-pago');
    await page.getByRole('button', { name: /Requiere factura|Facturación/ }).first().click();
    await shot(page, 'orden-pago-factura');

    await page.getByRole('button', { name: /Registrar Orden/ }).click();
    await page.getByText('¡ORDEN REGISTRADA!').waitFor({ timeout: 15_000 });
    await shot(page, 'orden-registrada');
    await page.getByRole('button', { name: /Volver al Tablero/ }).click();

    // --- Lavado y secado en una lavadora, hasta que pasa a secadora
    await tarjeta(page, 'L2').getByRole('button', { name: /Comenzar ciclo/i }).click();
    await page.getByText('Datos del Cliente').waitFor();
    await page.locator('input[placeholder="Ej. Juan Pérez"]').fill('Paola Garza');
    await page.locator('input[placeholder="Ej. 811 123 4567"]').fill('8117778899');
    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByRole('button', { name: /Lavado y secado/ }).first().click();
    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByRole('button', { name: /Siguiente/ }).click();
    await page.getByRole('button', { name: /Registrar Orden/ }).click();
    await page.getByText('¡ORDEN REGISTRADA!').waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /Volver al Tablero/ }).click();
    await page.waitForTimeout(600);

    await tarjeta(page, 'L2').getByRole('button', { name: /Gestionar/ }).click();
    await page.getByRole('button', { name: /Forzar Terminado/ }).click();
    await page.waitForTimeout(900);
    const grid = await page.locator('div.grid').first().boundingBox();
    await shot(page, 'lavado-secado', { clip: { x: 0, y: Math.max(0, grid.y - 24), width: VIEWPORT.width, height: 860 } });

    // --- Gasto
    await page.getByRole('button', { name: /^Gasto$/ }).click();
    await page.getByText('Registrar Gasto').waitFor();
    await page.locator('input[type="number"]').first().fill('80');
    await page.locator('input[placeholder*="Jabón"]').fill('Compra de bolsas');
    await shot(page, 'gasto');
    await page.getByRole('button', { name: 'Guardar Gasto' }).click();

    // --- Encargos
    await page.getByRole('link', { name: /Servicios Programados/ }).click();
    await page.getByRole('heading', { name: 'Servicios Programados' }).waitFor();
    await shot(page, 'servicios-programados');

    // --- Corte
    await page.getByTitle('Finalizar Turno').click();
    await page.getByText('Corte de Turno').waitFor();
    await page.locator('input[type="number"]').last().fill('1770');
    await shot(page, 'corte');

    await ctx.close();
}

// ============================================================ admin

async function manualAdmin(browser) {
    outDir = path.resolve('public/manual/admin');
    await mkdir(outDir, { recursive: true });
    console.log('\nAdmin');

    const { ctx, page } = await nuevoContexto(browser, {
        fn: () => localStorage.setItem('washouse_system_version', '2.0.0'),
        args: []
    });

    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="password"]').first().fill(ADMIN_PIN);
    await shot(page, 'login');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });

    const ir = async (ruta, nombre, espera) => {
        await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' });
        if (espera) await page.getByText(espera).first().waitFor({ timeout: 15_000 });
        await page.waitForTimeout(900);
        await shot(page, nombre);
    };

    await ir('/admin/dashboard', 'resumen', 'Flujo de Ingresos');
    await ir('/admin/dashboard/equipment', 'equipos', 'Monitor de Equipamiento');
    await ir('/admin/dashboard/shifts', 'turnos', 'Historial de Turnos');
    await ir('/admin/dashboard/logs', 'bitacora', 'Bitácora de Actividad');
    await ir('/admin/staff', 'personal', 'Administra accesos');
    await ir('/admin/clients', 'clientes', 'Directorio de Clientes');
    await ir('/admin/invoices', 'facturacion', 'Solicitudes de Factura Pendientes');
    await ir('/admin/reports', 'reportes', 'Inteligencia de Negocio');

    await ir('/admin/settings', 'config-sucursales', 'Gestión de Sucursales');
    const pestaña = async (label, nombre, espera) => {
        await page.getByRole('button', { name: new RegExp(label) }).first().click();
        await page.getByText(espera).first().waitFor({ timeout: 10_000 });
        await shot(page, nombre);
    };
    await pestaña('Servicios', 'config-servicios', 'Catálogo de Servicios');
    await pestaña('Insumos', 'config-insumos', 'Catálogo de Insumos');
    await pestaña('Facturación', 'config-iva', 'Modelo de IVA');
    await pestaña('Este Dispositivo', 'config-dispositivo', 'Vinculación de Dispositivo');

    await ctx.close();
}

// ============================================================ run

const browser = await chromium.launch();
try {
    if (!SOLO || SOLO === 'sucursal') await manualSucursal(browser);
    if (!SOLO || SOLO === 'admin') await manualAdmin(browser);
    console.log(`\n${hechas.length} capturas generadas.\n`);
} catch (err) {
    console.error('\nFalló la captura:', err.message);
    process.exitCode = 1;
} finally {
    await browser.close();
}
