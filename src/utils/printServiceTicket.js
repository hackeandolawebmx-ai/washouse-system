import Logo from '../assets/logo.png';

export const printServiceTicket = (order) => {
    if (!order || !order.items) {
        alert("No hay detalles para imprimir.");
        return;
    }

    const {
        id,
        customerName,
        customerPhone,
        totalAmount,
        advancePayment,
        balanceDue,
        items,
        createdAt,
        serviceLevel
    } = order;

    const orderId = id.split('-')[1] || id; // Extract readable part
    const isExpress = serviceLevel === 'express';

    // Build items rows
    const itemsHtml = items.map(item => {
        const isWeight = item.type === 'weight';
        const basePrice = item.price || item.basePrice || 0;

        let itemTotal = 0;
        if (isWeight) {
            if (item.serviceId === 'self_wash' || item.serviceId === 'wash_std') {
                const numLoads = Math.ceil(item.quantity / 5.999) || 1;
                const avgWeightPerLoad = item.quantity / numLoads;
                itemTotal = numLoads * basePrice;
                if (avgWeightPerLoad > (item.baseKg || 5)) {
                    itemTotal += numLoads * (item.extraPrice || 10);
                }
            } else {
                if (item.quantity <= (item.baseKg || 5)) {
                    itemTotal = basePrice;
                } else {
                    itemTotal = basePrice + (Math.ceil(item.quantity - (item.baseKg || 5)) * (item.extraPrice || 10));
                }
            }
        } else {
            itemTotal = basePrice * item.quantity;
        }

        const totalDisplay = itemTotal.toFixed(2);

        return `
            <div class="item">
                <span class="qty">${item.quantity}${isWeight ? 'kg' : ''}</span>
                <span class="name">
                    ${item.name}
                    ${isExpress ? '<br><small>(Express)</small>' : ''}
                </span>
                <span class="price">$${totalDisplay}</span>
            </div>
        `;
    }).join('');

    const renderTicket = (isCopy) => `
        <div class="ticket">
            <div class="header">
                ${isCopy
            ? '<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border: 2px solid #000; padding: 4px; display: inline-block;">COPIA - NEGOCIO</div>'
            : `<img src="${window.location.origin + Logo}" alt="Washouse" style="width: 60px; height: auto; margin-bottom: 10px;" />`
        }
                <div class="title">WASHOUSE</div>
                <div class="info">Orden: #${orderId}</div>
                <div class="info">${new Date(createdAt).toLocaleString()}</div>
                <div class="info" style="font-weight:bold; margin-top:5px;">${customerName}</div>
                ${customerPhone ? `<div class="info">${customerPhone}</div>` : ''}
            </div>
            
            <div class="items">
                ${itemsHtml}
            </div>
     
            <div class="totals">
                <div class="total-row final-total">
                    <span>TOTAL</span>
                    <span>$${totalAmount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Anticipo</span>
                    <span>-$${advancePayment.toFixed(2)}</span>
                </div>
                <div class="total-row balance">
                    <span>PENDIENTE</span>
                    <span>$${balanceDue.toFixed(2)}</span>
                </div>
            </div>
     
            <div class="footer">
                ${!isCopy ? '<p>¡Gracias por su preferencia!</p>' : '<p>Recibo Interno</p>'}
                <p style="text-align:left; margin-top:10px;">
                    <strong>Condiciones:</strong><br/>
                    1. Reclamos solo dentro de 24h.<br/>
                    2. No respondemos por botones o cierres.<br/>
                    3. Ropa abandonada 30 días se donará.
                </p>
            </div>
        </div>
    `;

    const ticketHtml = `
    <html>
    <head>
        <title>Ticket - Washouse</title>
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
                font-size: 20px;
                font-weight: bold;
            }
            .info {
                font-size: 12px;
                margin-top: 5px;
            }
            .items {
                margin-bottom: 10px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
            }
            .item {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .qty { width: 65px; vertical-align: top; }
            .name { flex: 1; text-align: left; vertical-align: top; padding-right: 5px; }
            .price { text-align: right; vertical-align: top; width: 60px; }
            
            .totals {
                text-align: right;
                font-size: 14px;
                line-height: 1.4;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
            }
            .final-total {
                font-size: 18px;
                font-weight: bold;
                border-top: 1px dashed #000;
                margin-top: 5px;
                padding-top: 5px;
            }
            .balance {
                font-weight: bold;
                margin-top: 5px;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 11px;
                margin-bottom: 30px;
            }
            .cut-line {
                border-top: 1px dashed #000;
                margin: 40px 0;
                text-align: center;
                font-size: 10px;
                position: relative;
            }
            .cut-line span {
                background: #fff;
                position: absolute;
                top: -6px;
                left: 50%;
                transform: translateX(-50%);
                padding: 0 10px;
            }
            @media print {
                @page { margin: 0; size: auto; }
            }
        </style>
    </head>
    <body>
        ${renderTicket(false)}
        <div class="cut-line"><span>-- CORTE AQUI --</span></div>
        ${renderTicket(true)}
 
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
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
