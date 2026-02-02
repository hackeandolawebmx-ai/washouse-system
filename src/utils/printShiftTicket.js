
import Logo from '../assets/logo.png';

export const printShiftTicket = (shiftData) => {
    if (!shiftData) return;

    const {
        closedBy,
        startTime,
        endedAt,
        initialCash,
        totalSales,
        finalCash,
        expectedDrawer,
        difference,
        expenses
    } = shiftData;

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
        <div class="header">
            <img src="${window.location.origin + Logo}" alt="Washouse" style="width: 40px; margin-bottom: 5px;" />
            <div class="title">CORTE DE CAJA</div>
            <div class="info">Responsable: ${closedBy || 'N/A'}</div>
            <div class="info">Inicio: ${new Date(startTime).toLocaleString()}</div>
            <div class="info">Fin: ${new Date(endedAt).toLocaleString()}</div>
        </div>
        
        <div class="section">
            <div class="title" style="font-size: 14px;">RESUMEN</div>
            <div class="row">
                <span>Fondo Inicial:</span>
                <span>$${parseFloat(initialCash).toFixed(2)}</span>
            </div>
            <div class="row">
                <span>Ventas Totales:</span>
                <span>$${parseFloat(totalSales).toFixed(2)}</span>
            </div>
            
            ${expenses && expenses > 0 ? `
            <div class="row">
                <span>Gastos/Retiros:</span>
                <span>-$${parseFloat(expenses).toFixed(2)}</span>
            </div>` : ''}

            <div class="total-row">
                <span>ESPERADO EN CAJA:</span>
                <span>$${parseFloat(expectedDrawer).toFixed(2)}</span>
            </div>
        </div>

        <div class="section">
            <div class="title" style="font-size: 14px;">CONTEO DE EFECTIVO</div>
            <div class="total-row">
                <span>REAL EN CAJA:</span>
                <span>$${parseFloat(finalCash).toFixed(2)}</span>
            </div>
            
            <div class="row" style="margin-top: 10px; font-weight: bold;">
                <span>DIFERENCIA:</span>
                <span style="${difference < 0 ? 'color: black;' : ''}">
                    ${difference > 0 ? '+' : ''}$${parseFloat(difference).toFixed(2)}
                </span>
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
