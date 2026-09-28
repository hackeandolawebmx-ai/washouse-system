/**
 * Manual del mostrador — se muestra en /sucursal/manual.
 *
 * Solo texto y estructura; ManualView decide cómo se ve. Las capturas viven
 * en public/manual/sucursal/ y se regeneran con scripts/capturas-manual.mjs.
 *
 * Bloques disponibles: p, steps, list, img, note, table. En los textos,
 * **así** se muestra en negritas.
 */

const img = (name) => `/manual/sucursal/${name}.png`;

export const manualSucursal = {
    title: 'Manual del Mostrador',
    subtitle: 'Todo lo que necesitas para abrir, atender y cerrar el turno. Las secciones siguen el orden de la jornada.',
    sections: [
        {
            id: 'antes',
            title: 'Antes de empezar',
            blocks: [
                {
                    type: 'table',
                    head: ['Qué', 'Cómo debe estar'],
                    rows: [
                        ['Dirección', '**washouse.app/sucursal** — la raíz del sitio es la página para clientes'],
                        ['Navegador', 'Chrome o Edge. La báscula USB solo funciona en esos dos'],
                        ['Internet', 'Indispensable. La app guarda todo en el momento; sin conexión no registra nada'],
                        ['Ventanas emergentes', 'Permitidas para el sitio. Los tickets se imprimen en una ventana nueva']
                    ]
                },
                {
                    type: 'note', tone: 'warn', title: 'Revisa la sucursal antes de teclear tu PIN',
                    text: 'Arriba a la izquierda, junto al logo, siempre dice en qué **sucursal** estás; la pantalla de identificación también lo repite. Si dice otra sucursal, o **"Sin vincular"** en amarillo, no abras turno: el equipo está mal vinculado y todo lo que registres quedará en la sucursal equivocada. Avisa al administrador.'
                }
            ]
        },
        {
            id: 'abrir-turno',
            title: 'Abrir el turno',
            blocks: [
                { type: 'p', text: 'Hasta que abras turno, el sistema no deja operar máquinas, cobrar ni registrar gastos.' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Toca tu nombre y escribe tu PIN de 4 dígitos.', text: 'Solo aparece el personal de esta sucursal. Si el sistema dice que el PIN pertenece a otro usuario, elegiste el perfil equivocado.' },
                        { title: 'Cuenta el efectivo del cajón y captúralo como fondo inicial.', text: 'Es la base del corte. Si lo capturas mal, el corte del final saldrá con diferencia.' },
                        { title: 'Confirma que arriba a la derecha diga "En turno" con tu nombre.' }
                    ]
                },
                { type: 'img', src: img('identificacion'), caption: 'La sucursal aparece arriba, antes de pedir el PIN.' },
                { type: 'img', src: img('apertura-caja'), caption: 'El fondo inicial es la base contra la que se compara el corte.' },
                {
                    type: 'note', tone: 'info', title: 'Si te equivocas de PIN varias veces',
                    text: 'Después de 8 intentos fallidos seguidos, la sucursal queda bloqueada 5 minutos, aunque luego escribas el PIN correcto. Es una protección contra quien intente adivinar PINes. Espera y vuelve a intentar.'
                }
            ]
        },
        {
            id: 'tablero',
            title: 'El tablero de máquinas',
            blocks: [
                { type: 'p', text: 'Pestaña **Lavado Asistido**. Las máquinas están en dos carriles, **Lavadoras** y **Secadoras**, siempre en el mismo orden que en el piso: una tarjeta nunca cambia de lugar.' },
                { type: 'p', text: 'Arriba, cada filtro dice **cuántas máquinas hay en ese estado**. Toca uno para ver solo esas. Cuando hay máquinas esperando a que alguien las libere, **Terminado** se pinta de naranja.' },
                { type: 'img', src: img('tablero'), caption: 'El color de la orilla dice el estado; cada tarjeta tiene un solo botón con la acción que sigue.' },
                {
                    type: 'table',
                    head: ['Estado', 'Botón', 'Qué hace'],
                    rows: [
                        ['Disponible', 'Comenzar ciclo', 'Abre una orden nueva con esa máquina ya seleccionada'],
                        ['En uso', 'Gestionar', 'Muestra la orden. Ahí está **Forzar Terminado** si el ciclo real acabó antes'],
                        ['Terminado', 'Liberar equipo (naranja)', 'La deja disponible. **Solo cuando el cliente ya sacó su ropa**'],
                        ['Mantenimiento', 'Reactivar', 'La regresa a servicio. Para mandar una máquina a mantenimiento, usa la llave 🔧 de su tarjeta']
                    ]
                },
                { type: 'p', text: 'Los tiempos los pone el sistema: **45 minutos** si la orden incluye lavado, **30** si no. No se capturan a mano.' }
            ]
        },
        {
            id: 'orden',
            title: 'Registrar una orden',
            blocks: [
                { type: 'p', text: 'Cinco pasos. **Enter** avanza y **Atrás** regresa sin perder lo capturado. Toda venta pasa por aquí, aunque sea de diez pesos: lo que no se captura no aparece en el corte.' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Cliente: nombre y teléfono, los dos obligatorios.', text: 'El teléfono es el que se usa para avisarle por WhatsApp. Escríbelo completo, a 10 dígitos.' },
                        { title: 'Servicios: búscalos o filtra por categoría, y tócalos para agregarlos.', text: 'En el resumen de la derecha ajustas cantidades o kilos y quitas renglones. Arriba eliges Mostrador o una máquina libre.' },
                        { title: 'Insumos: productos sueltos que se lleva el cliente.', text: 'Si no lleva nada, pasa de largo. Las existencias se descuentan solas.' },
                        { title: 'Pago: pregunta si requiere factura, captura el monto y el método.' },
                        { title: 'Entrega el folio: imprime el ticket del cliente y el del negocio, y manda el WhatsApp.', text: 'El cliente necesita el folio para pedir su factura después.' }
                    ]
                },
                { type: 'img', src: img('orden-cliente'), caption: 'Paso 1 · Datos del cliente.' },
                { type: 'img', src: img('orden-servicios'), caption: 'Paso 2 · El resumen de la derecha es donde se ajustan cantidades.' },
                { type: 'img', src: img('orden-insumos'), caption: 'Paso 3 · Insumos.' },
                {
                    type: 'table',
                    head: ['Tipo de orden', 'Mínimo que tienes que cobrar'],
                    rows: [
                        ['Con máquina asignada', '**100%** — la máquina no arranca con menos'],
                        ['De mostrador (encargo)', '**50%** de anticipo']
                    ]
                },
                { type: 'img', src: img('orden-pago'), caption: 'Sin factura: el cliente paga el precio de lista.' },
                { type: 'img', src: img('orden-pago-factura'), caption: 'Con factura: la misma orden suma el IVA. Lo que cobras y lo que dice la factura coinciden.' },
                {
                    type: 'note', tone: 'warn', title: 'La factura se decide antes de cobrar',
                    text: 'Activa el interruptor de factura **solo si el cliente la pide**: ahí se suma el IVA. Si la pide días después, el IVA ya no se cobró y lo resuelve administración.'
                },
                { type: 'img', src: img('orden-registrada'), caption: 'Paso 5 · El folio, los dos tickets y el aviso por WhatsApp.' },
                {
                    type: 'list',
                    items: [
                        '**Lavadora y lavado estándar:** cada 6 kg cuenta como una carga nueva. Si el promedio por carga pasa de 5 kg, se agrega el cargo extra.',
                        '**Los demás servicios por kilo:** precio base hasta 5 kg, y después el extra por cada kilo adicional.',
                        'Si hay báscula conectada, el peso entra solo. Si no, escríbelo en el resumen.'
                    ]
                }
            ]
        },
        {
            id: 'lavado-secado',
            title: 'Lavado y secado',
            blocks: [
                { type: 'p', text: 'Cuando registras **Lavado y secado** en una lavadora, el sistema hace el proceso en orden: primero lava y, cuando la lavadora termina, arranca solo una secadora.' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Mientras lava', text: 'La lavadora dice "Al terminar pasa a secadora". La secadora sigue libre para otros clientes.' },
                        { title: 'Al terminar el lavado', text: 'Arranca una secadora sola. La lavadora dice "Pasa la ropa a S9" (o la que haya tocado). Pasa la ropa y luego toca Liberar equipo en la lavadora.' },
                        { title: 'Si no hay secadora libre', text: 'La lavadora dice "Esperando secadora libre". En cuanto liberes una secadora, el secado arranca solo en ella.' }
                    ]
                },
                { type: 'img', src: img('lavado-secado'), caption: 'L2 terminó de lavar: la ropa pasa a S9, que ya está secando.' },
                {
                    type: 'note', tone: 'warn', title: 'No liberes una lavadora con secado pendiente',
                    text: 'Si liberas una lavadora que todavía espera secadora, el sistema te lo advierte: el secado ya no arrancaría solo.'
                }
            ]
        },
        {
            id: 'encargos',
            title: 'Encargos (Servicios Programados)',
            blocks: [
                { type: 'p', text: 'Órdenes que el cliente deja y recoge después: planchado, edredones, compostura. Un tablero de dos columnas: **Recibido** y **Terminado**.' },
                { type: 'img', src: img('servicios-programados'), caption: 'Cada tarjeta muestra el folio, el cliente, si está pagada y quién la recibió.' },
                {
                    type: 'list',
                    items: [
                        'Busca por nombre del cliente o por folio.',
                        'Para pasar una orden a Terminado, el sistema pide confirmación.',
                        '**Si queda saldo, se abre el cobro antes de dejarla pasar.** Ninguna orden se termina sin liquidar.',
                        'Al terminar, ofrece mandar el WhatsApp de "tu ropa ya está lista".'
                    ]
                }
            ]
        },
        {
            id: 'gastos',
            title: 'Gastos de caja',
            blocks: [
                { type: 'p', text: 'Cualquier dinero que sale del cajón durante el turno —una compra urgente de insumos, un pago en efectivo— se registra con el botón **Gasto** del tablero.' },
                { type: 'img', src: img('gasto'), caption: 'Monto, descripción y categoría.' },
                { type: 'note', tone: 'warn', title: 'Si no lo registras, sale como faltante', text: 'El corte resta los gastos registrados del efectivo esperado. Un gasto sin registrar aparece como dinero que falta.' }
            ]
        },
        {
            id: 'corte',
            title: 'Corte de turno',
            blocks: [
                { type: 'p', text: 'Botón de salida, arriba a la derecha. El sistema calcula cuánto efectivo debería haber:' },
                { type: 'note', tone: 'info', title: 'Efectivo esperado', text: '**Fondo inicial + Ventas en efectivo − Gastos**. Las ventas con tarjeta se listan aparte y no cuentan.' },
                {
                    type: 'steps',
                    items: [
                        { title: 'Cuenta el dinero físico y captúralo en "Declarar Efectivo en Caja".' },
                        { title: 'Revisa la diferencia.', text: 'Verde si cuadra, amarillo si no. Si no cuadra, cuenta otra vez antes de cerrar.' },
                        { title: 'Imprime el comprobante y déjalo con el dinero.' },
                        { title: 'Cierra el turno y confirma con "Sí, Cerrar Turno".' }
                    ]
                },
                { type: 'img', src: img('corte'), caption: 'La diferencia aparece en cuanto capturas el efectivo contado.' }
            ]
        },
        {
            id: 'problemas',
            title: 'Si algo falla',
            blocks: [
                {
                    type: 'table',
                    head: ['Lo que pasa', 'Qué hacer'],
                    rows: [
                        ['Arriba dice otra sucursal o "Sin vincular"', 'No abras turno. El administrador lo corrige en Configuración → Este Dispositivo'],
                        ['"Debes iniciar turno…"', 'El turno está cerrado. Ábrelo desde la pantalla de identificación'],
                        ['No acepta mi PIN', 'Revisa que elegiste tu perfil. Si fallaste 8 veces, espera 5 minutos'],
                        ['El tablero sale vacío', 'Recarga la página con Ctrl + Shift + R'],
                        ['El ticket no se imprime', 'Permite ventanas emergentes para el sitio y vuelve a imprimir desde la orden'],
                        ['La báscula no conecta', 'Solo en Chrome o Edge, con el cable puesto antes de abrir. Si falla, captura el peso a mano'],
                        ['Un ciclo terminó antes', 'Gestionar → Forzar Terminado'],
                        ['Se fue el internet', 'Anota las órdenes en papel y captúralas cuando vuelva la señal'],
                        ['Me equivoqué en una orden', 'El mostrador no puede borrar órdenes. Avisa a administración']
                    ]
                }
            ]
        },
        {
            id: 'rutina',
            title: 'Rutina del día',
            blocks: [
                { type: 'p', text: '**Al abrir:** revisa que diga tu sucursal, abre turno con el fondo contado, y revisa que ninguna máquina haya quedado en Terminado o Mantenimiento del día anterior.' },
                { type: 'p', text: '**Durante el día:** toda venta entra por el asistente, pregunta siempre si requiere factura, registra cada salida de efectivo como gasto, y libera las máquinas solo cuando el cliente ya sacó la ropa.' },
                { type: 'p', text: '**Al cerrar:** pasa a Terminado los encargos entregados, cuenta el efectivo, haz el corte e imprime el comprobante.' }
            ]
        }
    ]
};
