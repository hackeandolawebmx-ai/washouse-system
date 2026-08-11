# Plan: Sistema de Facturación para Washouse

**Objetivo:** Agregar facturación con número secuencial auto-generado a Washouse.  
**País:** México (SAT, RFC, IVA 16%, CFDI)  
**Alcance:** Módulo básico en Washouse + preparación para integración Facturación.py  
**Timeline:** ~3-4 horas de desarrollo

---

## 1. Estructura Base de Datos (Supabase)

### Tabla: `invoices`

```sql
create table if not exists invoices (
  id text primary key default gen_random_uuid()::text,
  branch_id text not null references branches(id) on delete cascade,
  order_id text references orders(id) on delete set null,
  
  -- Numeración
  invoice_number text not null,              -- '001', '002', etc. (único por sucursal)
  invoice_date timestamptz default now(),
  
  -- Cliente
  customer_name text not null,
  customer_phone text,
  customer_rfc text,                         -- RFC del cliente (opcional)
  
  -- Montos
  items jsonb not null default '[]',         -- Array de { description, qty, unit_price, total }
  subtotal numeric not null default 0,       -- Antes de IVA
  iva_amount numeric not null default 0,     -- 16% del subtotal
  total_amount numeric not null default 0,   -- subtotal + iva_amount
  
  -- Pago
  payment_method text,                       -- 'cash', 'card', 'transfer'
  discount_amount numeric default 0,         -- Si aplica descuento
  
  -- Estado
  status text default 'draft',                -- 'draft' | 'issued' | 'sent_to_sat' | 'cancelled'
  cfdi_uuid text,                             -- UUID de SAT (cuando se valide con Facturación.py)
  
  -- Auditoría
  created_by text,                            -- staff.id o admin que genera
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_invoices_branch_id on invoices(branch_id);
create index if not exists idx_invoices_order_id on invoices(order_id);
create index if not exists idx_invoices_invoice_number on invoices(invoice_number, branch_id);
```

### RLS Policy

```sql
alter table invoices enable row level security;
create policy "anon full access" on invoices for all using (true) with check (true);
```

---

## 2. Contexto React: `InvoiceContext.jsx`

**Ubicación:** `src/context/InvoiceContext.jsx`

**Responsabilidades:**
- Fetch invoices by branch
- Create/update/delete invoices
- Generate next invoice number (secuencial)
- Calcular IVA automáticamente (16%)

**Métodos:**

```javascript
// Fetch todas las facturas de una sucursal
const fetchInvoices = async (branchId) => { }

// Crear factura en draft
const createInvoice = async (branchId, orderData) => {
  // Genera número secuencial (último + 1)
  // Calcula IVA: subtotal * 0.16
  // Guarda en Supabase
}

// Actualizar factura (antes de enviar a SAT)
const updateInvoice = async (invoiceId, data) => { }

// Marcar como "emitida" (lista para imprimir/SAT)
const issueInvoice = async (invoiceId) => {
  // status: 'draft' → 'issued'
}

// Anular factura
const cancelInvoice = async (invoiceId) => {
  // status → 'cancelled'
}

// Obtener próximo número secuencial para sucursal
const getNextInvoiceNumber = async (branchId) => {
  // SELECT COUNT(*) FROM invoices WHERE branch_id = X AND status != 'cancelled'
  // Retorna: (count + 1).padStart(6, '0') → '000001'
}
```

---

## 3. Componentes UI

### A. `NewInvoiceModal.jsx`

**Ubicación:** `src/components/admin/NewInvoiceModal.jsx`

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  orderId?: string,           // Si viene de una orden
  orderData?: { customerName, customerPhone, items, total }
}
```

**Funcionalidad:**
- Formulario con:
  - Cliente (nombre, teléfono, RFC opcional)
  - Items (precargados de orden si existe, o manual)
  - Subtotal (auto-calculado)
  - IVA (16%, auto-calculado)
  - Total (auto-calculado)
  - Método de pago (cash, card, transfer)
  - Descuento (opcional)
  
- Preview en tiempo real de factura
- Botón "Generar Factura" (guarda como draft)
- Botón "Generar e Imprimir" (guarda como draft + abre preview para imprimir)

---

### B. `InvoicePreview.jsx`

**Ubicación:** `src/components/admin/InvoicePreview.jsx`

**Muestra:**
```
╔═══════════════════════════════╗
║      WASHOUSE LAVANDERÍA      ║
║   Factura Electrónica (CFDI)  ║
║                               ║
║ Número:      001              ║
║ Fecha:       2026-08-10       ║
║ RFC:         [empresa]        ║
║                               ║
║ CLIENTE                       ║
║ Nombre: María López           ║
║ RFC:    [opcional]            ║
║                               ║
║ CONCEPTO          QTY PRECIO  ║
║ ─────────────────────────────┤
║ Lavado General     1   $100   ║
║ Secado Especial    2   $50    ║
║ ─────────────────────────────┤
║ Subtotal:                $200 ║
║ IVA (16%):               $32  ║
║ Descuento:                $0  ║
║ ─────────────────────────────┤
║ TOTAL:                   $232 ║
║                               ║
║ Método Pago: Efectivo         ║
║                               ║
║ Emitido: 2026-08-10 14:30     ║
╚═══════════════════════════════╝
```

**Botones:**
- 🖨️ Imprimir
- 💾 Guardar como PDF
- ❌ Cancelar

---

### C. `InvoicesTable.jsx`

**Ubicación:** `src/components/admin/InvoicesTable.jsx`

**Muestra:** Tabla con todas las facturas de la sucursal
- Número | Cliente | Total | Fecha | Estado | Acciones (Ver, Editar, Anular)

---

## 4. Integración con Órdenes

### Opción A: Botón en OrderDetailsModal (recomendado)

```javascript
// En src/components/ui/OrderDetailsModal.jsx

{order.status === 'COMPLETED' && !order.invoiceId && (
  <Button variant="primary" onClick={openNewInvoiceModal}>
    💰 Generar Factura
  </Button>
)}

// Si ya tiene factura:
{order.invoiceId && (
  <Button variant="outline" onClick={() => viewInvoice(order.invoiceId)}>
    📄 Ver Factura
  </Button>
)}
```

### Opción B: Página dedicada en Admin

- Menú: Admin → Facturación
- Lista de órdenes "completadas sin facturar"
- Click → abre NewInvoiceModal

---

## 5. Actualizar Ticket Impreso

### Archivo: `src/utils/printServiceTicket.js`

**Agregar sección de factura:**

```javascript
// Al final del ticket, si existe factura:

if (invoice) {
  return `
    ...
    ╔════════════════════════════╗
    ║        FACTURA FISCAL      ║
    ║                            ║
    ║ Número:    ${invoice.invoice_number}
    ║ Fecha:     ${invoice.invoice_date}
    ║ RFC:       [empresa_rfc]   ║
    ║                            ║
    ║ Cliente: ${invoice.customer_name}
    ║                            ║
    ║ Subtotal:    $${invoice.subtotal}
    ║ IVA (16%):   $${invoice.iva_amount}
    ║ TOTAL:       $${invoice.total_amount}
    ║ Pago:        ${invoice.payment_method}
    ║                            ║
    ║ CFDI: [${invoice.cfdi_uuid || 'En proceso'}]
    ╚════════════════════════════╝
  `;
}
```

---

## 6. Páginas/Rutas

### Nueva Ruta en Admin

```javascript
// En src/App.jsx, dentro de AdminLayout:

<Route path="/admin/invoices" element={<InvoicesPage />} />
```

**InvoicesPage.jsx:**
- Tabla de todas las facturas
- Filtros: por fecha, estado, cliente
- Botón "Nueva Factura Manual"
- Búsqueda por número de factura

---

## 7. StorageContext - Actualizar

Agregar métodos para involces al StorageContext:

```javascript
const { invoices, createInvoice, updateInvoice, deleteInvoice } = useStorage();
```

---

## 8. Implementación Step-by-Step

### Phase 1: Backend (1 hora)
- [ ] Crear tabla `invoices` en Supabase
- [ ] Crear RLS policy
- [ ] Crear índices

### Phase 2: Context (1 hora)
- [ ] Crear `InvoiceContext.jsx`
- [ ] Implementar CRUD methods
- [ ] Integrar en `StorageContext.jsx`

### Phase 3: UI Components (1.5 horas)
- [ ] `NewInvoiceModal.jsx` (formulario)
- [ ] `InvoicePreview.jsx` (vista previa)
- [ ] `InvoicesTable.jsx` (listado)

### Phase 4: Integración (30 min)
- [ ] Agregar botón en `OrderDetailsModal.jsx`
- [ ] Actualizar `printServiceTicket.js`
- [ ] Crear `InvoicesPage.jsx`

### Phase 5: Testing (30 min)
- [ ] Generar factura de prueba
- [ ] Imprimir ticket con factura
- [ ] Verificar cálculos (IVA, totales)

---

## 9. Futura Integración: Facturación.py

Cuando sea ready, el flujo será:

1. Usuario genera factura en Washouse (draft)
2. Click "Enviar a SAT" → API call a Facturación.py
3. Facturación.py:
   - Valida datos con esquema SAT
   - Firma digitalmente con tu CSD
   - Envía a SAT
   - Retorna CFDI UUID
4. Washouse:
   - Guarda CFDI UUID en campo `cfdi_uuid`
   - Cambia status a `sent_to_sat`
   - Muestra ✅ "Factura validada" en tabla

**API Key Facturación.py:**
- Será variable de entorno: `VITE_FACTURACION_PY_API_KEY`
- Guarda en `.env`

---

## 10. Datos de Ejemplo

```javascript
// Invoice generada:
{
  id: "inv_123",
  branch_id: "branch_001",
  order_id: "order_xyz",
  invoice_number: "000001",
  invoice_date: "2026-08-10T14:30:00Z",
  customer_name: "María López",
  customer_phone: "555-1234",
  customer_rfc: null,
  items: [
    { description: "Lavado General", qty: 1, unit_price: 100, total: 100 },
    { description: "Secado Especial", qty: 2, unit_price: 50, total: 100 }
  ],
  subtotal: 200,
  iva_amount: 32,   // 200 * 0.16
  total_amount: 232,
  payment_method: "cash",
  discount_amount: 0,
  status: "draft",
  cfdi_uuid: null,
  created_by: "admin_master",
  created_at: "2026-08-10T14:30:00Z"
}
```

---

## 11. Checklist Final

- [ ] Tabla `invoices` creada en Supabase
- [ ] RLS habilitado en `invoices`
- [ ] `InvoiceContext` con todos los métodos
- [ ] `NewInvoiceModal` funcional (crear factura)
- [ ] `InvoicePreview` muestra datos correctamente
- [ ] `InvoicesTable` lista todas las facturas
- [ ] Botón "Generar Factura" en OrderDetailsModal
- [ ] Ticket impreso incluye datos de factura
- [ ] IVA calculado correctamente (16%)
- [ ] Número secuencial auto-generado
- [ ] Acceso a Admin → Facturación
- [ ] Tests: crear, editar, anular facturas
- [ ] Build pasa sin errores

---

## 12. Notas Importantes

- **Número Secuencial:** Empieza en 000001 por sucursal (no reset anual, es acumulativo)
- **IVA Fijo:** 16% — si en futuro cambia ley, hacer configurable por branch
- **RFC Empresa:** Guardarla en `branches` table para incluir en todas las facturas
- **CFDI UUID:** Campo reservado para cuando integres Facturación.py
- **Historial:** Las facturas anuladas (status = 'cancelled') se mantienen (no se borran) para auditoría

---

## Inicio

¿Empezamos con Phase 1 (crear tabla en Supabase)?
