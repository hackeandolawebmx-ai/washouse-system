import Logo from '../assets/logo_bw.png';

const COPIES = ['COPIA NEGOCIO', 'COPIA RESPONSABLE'];

const money = (value) => `$${(parseFloat(value) || 0).toFixed(2)}`;

export const printShiftTicket = (shiftData) => {
    if (!shiftData) return;

    const {
        closedBy,
        startTime,
        endedAt,
        initialCash,
        totalSales,
        cashSales,
        cardSales,
        transferSales,
        finalCash,
        expectedDrawer,
        difference,
        totalExpenses
    } = shiftData;

    const ticketBody = (copyLabel) => `
        <div class="ticket">
            <div class="header">
                <img src="${window.location.origin + Logo}" alt="Washouse" style="width: 100px; margin-bottom: 5px;" />
                <div class="title">CORTE DE CAJA</div>
                <div class="copy">${copyLabel}</div>
                <div class="info">Responsable: ${closedBy || 'N/A'}</div>
                <div class="info">Inicio: ${new Date(startTime).toLocaleString('es-MX')}</div>
                <div class="info">Fin: ${new Date(endedAt).toLocaleString('es-MX')}</div>
            </div>

            <div class="section">
                <div class="title" style="font-size: 14px;">VENTAS</div>
                <div class="row"><span>Efectivo:</span><span>${money(cashSales)}</span></div>
                <div class="row"><span>Tarjeta:</span><span>${money(cardSales)}</span></div>
                <div class="row"><span>Transferencia:</span><span>${money(transferSales)}</span></div>
                <div class="total-row"><span>VENTAS TOTALES:</span><span>${money(totalSales)}</span></div>
            </div>

            <div class="section">
                <div class="title" style="font-size: 14px;">EFECTIVO EN CAJA</div>
                <div class="row"><span>Fondo Inicial:</span><span>${money(initialCash)}</span></div>
                <div class="row"><span>Ventas Efectivo:</span><span>+${money(cashSales)}</span></div>
                ${totalExpenses > 0 ? `<div class="row"><span>Gastos/Retiros:</span><span>-${money(totalExpenses)}</span></div>` : ''}
                <div class="total-row"><span>ESPERADO EN CAJA:</span><span>${money(expectedDrawer)}</span></div>
                <div class="total-row"><span>REAL EN CAJA:</span><span>${money(finalCash)}</span></div>
                <div class="row" style="margin-top: 10px; font-weight: bold;">
                    <span>DIFERENCIA:</span>
                    <span>${difference > 0 ? '+' : ''}${money(difference)}</span>
                </div>
                <div class="info" style="text-align: right; margin-top: 2px;">
                    ${difference === 0 ? '(Correcto)' : difference < 0 ? '(Faltante)' : '(Sobrante)'}
                </div>
            </div>

            <div class="footer">
                <p>Firma de Conformidad</p>
                <br/><br/>
                <p>__________________________</p>
            </div>
        </div>
    `;

    const ticketHtml = `
    <html>
    <head>
        <title>Corte de Caja - Washouse</title>
        <style>
            body {
                font-family: 'Courier New', monospace;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
                color: #000;
            }
            .ticket + .ticket {
                page-break-before: always;
                break-before: page;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
            }
            .title {
                font-size: 18px;
                font-weight: bold;
                margin: 5px 0;
            }
            .copy {
                font-size: 12px;
                font-weight: bold;
                border: 1px solid #000;
                display: inline-block;
                padding: 1px 6px;
                margin-bottom: 4px;
            }
            .info {
                font-size: 12px;
                margin-top: 5px;
            }
            .section {
                margin-bottom: 15px;
            }
            .row {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-bottom: 3px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 14px;
                border-top: 1px dashed #000;
                padding-top: 5px;
                margin-top: 5px;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
            }
            @media print {
                @page { margin: 0; size: auto; }
            }
        </style>
    </head>
    <body>
        ${COPIES.map(ticketBody).join('')}

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
        printWindow.document.write(ticketHtml);
        printWindow.document.close();
    } else {
        alert("Por favor habilita las ventanas emergentes para imprimir.");
    }
};
