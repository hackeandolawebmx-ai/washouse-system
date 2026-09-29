/**
 * Manual de administración — se muestra en /admin/manual.
 *
 * Mismo formato que manuals/sucursal.js. Capturas en public/manual/admin/.
 */

const img = (name) => `/manual/admin/${name}.png`;

export const manualAdmin = {
    title: 'Manual de Administración',
    subtitle: 'Cómo supervisar la operación, administrar al personal, facturar y configurar cada sucursal.',
    sections: [
        {
            id: 'entrar',
            title: 'Entrar al panel',
            blocks: [
                { type: 'p', text: 'El panel vive en **washouse.app/admin**. Pide el PIN de administrador; la sesión dura mientras el navegador esté abierto. Para salir antes, usa **Cerrar sesión** al pie del menú: no afecta el turno del mostrador si comparten equipo.' },
                { type: 'img', src: img('login'), caption: 'Acceso con PIN de administrador.' },
                {
                    type: 'note', tone: 'warn', title: 'El PIN de administrador abre todo',
                    text: 'Con él se ven ventas, clientes y facturas de todas las sucursales, y se cambian precios y PINes. No lo compartas con el personal de mostrador. Después de 8 intentos fallidos seguidos, el acceso de administrador se bloquea 5 minutos.'
                }
            ]
        },
        {
            id: 'inicio',
            title: 'Inicio',
            blocks: [
                { type: 'p', text: 'Arriba eliges **qué sucursal** ver (o todas) y el **periodo**: Hoy, Esta semana, Este mes, Mes pasado o un rango personalizado. Toda la pantalla responde a ese filtro, salvo **Por cobrar**.' },
                { type: 'img', src: img('inicio'), caption: 'Inicio: cómo va el negocio en el periodo elegido.' },
                {
                    type: 'table',
                    head: ['Indicador', 'Qué significa'],
                    rows: [
                        ['Ingresos', 'Todo lo cobrado en el periodo: pagos completos, anticipos y saldos liquidados'],
                        ['Órdenes', 'Cuántas órdenes se registraron, cuántas ya están pagadas y cuántas tienen saldo'],
                        ['Por cobrar', 'Lo que los clientes deben **hoy**, sin importar cuándo dejaron la orden. No está en Ingresos hasta que se cobra'],
                        ['Gastos', 'Los gastos que el mostrador registró en caja'],
                        ['Utilidad', 'Ingresos menos gastos registrados. No incluye renta, sueldos ni servicios si no se registraron como gasto']
                    ]
                },
                {
                    type: 'list',
                    items: [
                        '**Por método de pago:** cuánto entró en efectivo, tarjeta y transferencia. Solo el efectivo va al cajón; tarjeta y transferencia se cuadran contra el banco.',
                        '**Por cobrar:** la lista de órdenes con saldo, de la más vieja a la más nueva. Los días en rojo llevan una semana o más. El botón de WhatsApp manda el recordatorio con el saldo.',
                        '**Equipos y último corte:** un vistazo rápido; toca el título para ir al detalle.',
                        '**Exportar:** descarga en Excel (CSV) los ingresos y gastos del periodo.'
                    ]
                }
            ]
        },
        {
            id: 'equipos',
            title: 'Equipos',
            blocks: [
                { type: 'img', src: img('equipos'), caption: 'El estado de cada máquina en tiempo real.' },
                { type: 'p', text: 'Aquí ves quién está usando cada máquina, la pones en **mantenimiento** o detienes un ciclo con el **Paro de Emergencia** si hace falta.' }
            ]
        },
        {
            id: 'cortes',
            title: 'Cortes de caja',
            blocks: [
                { type: 'img', src: img('cortes'), caption: 'Cada turno cerrado: cuándo, quién, cuánto duró, con qué fondo abrió y cuánto vendió.' },
                { type: 'p', text: 'Si un corte no cuadró, revisa también la **Bitácora** de ese día en Configuración: dice qué pasó, cuándo y quién lo hizo.' }
            ]
        },
        {
            id: 'personal',
            title: 'Personal',
            blocks: [
                { type: 'img', src: img('personal'), caption: 'Alta, edición y baja del personal.' },
                { type: 'p', text: 'Con **Nuevo Empleado** se abre el formulario:' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Nombre completo y PIN de 4 dígitos.', text: 'Evita PINes obvios como 0000, 1234 o el año. Cada persona debe tener el suyo: la bitácora y los cortes quedan a su nombre.' },
                        { title: 'Rol.', text: 'Operador para el mostrador; Administrador solo para quien deba ver y cambiar todo.' },
                        { title: 'Sucursal asignada.', text: 'Solo aparece en la pantalla de identificación de esa sucursal. "Todas las sucursales" lo muestra en cualquiera.' }
                    ]
                },
                { type: 'p', text: 'Para cambiar un PIN, edita a la persona y escribe el nuevo. Si dejas el PIN en blanco al editar, se conserva el actual.' }
            ]
        },
        {
            id: 'clientes',
            title: 'Base de clientes',
            blocks: [
                { type: 'p', text: 'Se arma sola con cada orden: no hay que dar de alta a nadie. Muestra visitas, gasto total y **deuda actual** (encargos con saldo pendiente).' },
                { type: 'img', src: img('clientes'), caption: 'Directorio con búsqueda por nombre o teléfono.' },
                {
                    type: 'list',
                    items: [
                        '**Notas:** preferencias del cliente que verá quien lo atienda.',
                        '**Historial:** todas sus órdenes.',
                        '**WhatsApp:** abre la conversación, útil para cobrar saldos pendientes.'
                    ]
                }
            ]
        },
        {
            id: 'facturacion',
            title: 'Facturación',
            blocks: [
                { type: 'p', text: 'Las facturas llegan por dos caminos: el cliente las **solicita** desde washouse.app con el folio de su ticket, o tú creas una **Nueva Factura** manual.' },
                { type: 'img', src: img('facturacion'), caption: 'Las solicitudes pendientes aparecen arriba; el menú lateral muestra cuántas hay.' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Revisa la solicitud.', text: 'Trae el folio, la razón social, el RFC y el correo del cliente.' },
                        { title: 'Generar Factura.', text: 'Se abre ya llena con los datos de la orden. Revisa y guarda: queda como Borrador.' },
                        { title: 'Emitir.', text: 'Se envía a Facturama para timbrarla ante el SAT. Una factura emitida ya no se borra: se anula.' }
                    ]
                },
                {
                    type: 'table',
                    head: ['Estado', 'Qué significa'],
                    rows: [
                        ['Borrador', 'Guardada, todavía sin timbrar. Se puede editar o eliminar'],
                        ['Emitida', 'Timbrada ante el SAT'],
                        ['Anulada', 'Cancelada. Queda el registro']
                    ]
                },
                {
                    type: 'note', tone: 'info', title: 'Si el cliente pide factura después de pagar',
                    text: 'En el mostrador, el IVA solo se cobra si el cliente pidió factura al pagar. Si la pide después, la orden se cobró sin IVA y tienes que decidir cómo ajustarlo antes de emitir.'
                }
            ]
        },
        {
            id: 'catalogo',
            title: 'Precios y catálogo',
            blocks: [
                { type: 'img', src: img('catalogo-servicios'), caption: 'Servicios: el catálogo y los precios, iguales en todas las sucursales.' },
                { type: 'note', tone: 'info', title: 'Un precio, en todos lados', text: 'El precio que cambies aquí es el que cobra el mostrador y el que ve el cliente en washouse.app. Aplica a las órdenes nuevas: las ya registradas conservan su precio.' },
                { type: 'p', text: '**Lavado y secado** se cobra con la tabla de tarifas por kilo del letrero; esa tabla no se edita desde aquí. Si cambia, pide a soporte que la actualice.' },
                { type: 'img', src: img('catalogo-insumos'), caption: 'Insumos: existencias y precio de venta por sucursal.' },
                { type: 'p', text: 'Las existencias bajan solas cuando el mostrador vende un insumo o registra un lavado con detergente incluido. Cuando llegue mercancía, súmala aquí.' }
            ]
        },
        {
            id: 'configuracion',
            title: 'Configuración',
            blocks: [
                { type: 'img', src: img('config-sucursales'), caption: 'Sucursales: dirección y datos de cada sede.' },
                { type: 'img', src: img('config-iva'), caption: 'IVA: cómo se cobra en el mostrador.' },
                {
                    type: 'table',
                    head: ['Modo', 'Cómo funciona'],
                    rows: [
                        ['Se agrega al facturar', 'Los precios son sin IVA. En el cobro se pregunta si requiere factura y solo entonces se suma'],
                        ['IVA incluido en los precios', 'Un solo precio para todos. La factura desglosa el IVA sin cambiar el monto']
                    ]
                },
                { type: 'img', src: img('bitacora'), caption: 'Bitácora: registro de acciones importantes — turnos, accesos, cambios.' },
                { type: 'p', text: 'La **Bitácora** es el primer lugar para revisar cuando algo no cuadra: dice qué pasó, cuándo y quién lo hizo.' },
                { type: 'img', src: img('config-dispositivo'), caption: 'Este Dispositivo: a qué sucursal pertenece este navegador.' },
                {
                    type: 'note', tone: 'warn', title: 'Vincular una tablet',
                    text: 'La sucursal se guarda en cada navegador, no en la cuenta. Cada tablet se vincula una vez desde su propio navegador: entra al panel en esa tablet, ve a Este Dispositivo y elige la sucursal. Si luego se borran los datos del navegador o se usa otro, hay que vincularla de nuevo.'
                },
                { type: 'p', text: '**Mantenimiento:** Respaldo Total descarga una copia de la base. Reset de Fábrica solo limpia la sesión y la caché de este navegador; no borra ventas ni órdenes.' }
            ]
        },
        {
            id: 'tareas',
            title: 'Tareas frecuentes',
            blocks: [
                {
                    type: 'table',
                    head: ['Quiero…', 'Dónde'],
                    rows: [
                        ['Dar de alta a alguien nuevo', 'Personal → Nuevo Empleado, con su sucursal y un PIN propio'],
                        ['Cambiar un PIN', 'Personal → editar a la persona'],
                        ['Ver cuánto se vendió hoy o este mes', 'Inicio, eligiendo el periodo'],
                        ['Saber quién debe y cobrarle', 'Inicio → Por cobrar → botón de WhatsApp'],
                        ['Cambiar un precio', 'Precios y catálogo → Servicios'],
                        ['Registrar mercancía que llegó', 'Precios y catálogo → Insumos'],
                        ['Revisar un corte que no cuadró', 'Cortes de caja, y Configuración → Bitácora de ese día'],
                        ['Una tablet muestra otra sucursal', 'En esa tablet: Configuración → Este Dispositivo'],
                        ['Atender una solicitud de factura', 'Facturación → Generar Factura → Emitir']
                    ]
                },
                {
                    type: 'note', tone: 'info', title: 'Abrir una sucursal nueva',
                    text: 'Necesita a soporte técnico para dos pasos que no están en el panel: activar la licencia de la sucursal y publicarla en washouse.app. El resto se hace aquí: dar de alta la sucursal, sus equipos y su personal, y vincular sus tablets.'
                }
            ]
        }
    ]
};
