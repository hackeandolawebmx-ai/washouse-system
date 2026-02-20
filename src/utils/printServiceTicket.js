import { SERVICES_CATALOG } from '../data/catalog';
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
        const catalogItem = SERVICES_CATALOG.find(i => i.id === item.serviceId);
        const isWeight = catalogItem?.type === 'weight' || item.type === 'weight';

        let priceDisplay = '0.00';
        let totalDisplay = '0.00';

        // Calculate item total based on stored price or fallback
        if (item.price) { // Legacy or direct price
            totalDisplay = (item.price * item.quantity).toFixed(2);
            priceDisplay = item.price.toFixed(2);
        }

        // Specialized display for weight vs units
        // If we have detailed breakdown (base + extra) it would be nice, but simple line item is often enough
        // We will calculate total per item row
        if (isWeight) {
            // Re-calculate if needed or rely on stored? 
            // Ideally we passed "total" in item, but we likely calculated it on the fly in UI.
            // We can re-calculate here to be safe and consistent with UI logic:
            let itemTotal = 0;
            if (item.basePrice) {
                if (item.quantity <= item.baseKg) {
                    itemTotal = item.basePrice;
                } else {
                    itemTotal = item.basePrice + (Math.ceil(item.quantity - item.baseKg) * item.extraPrice);
                }
                totalDisplay = itemTotal.toFixed(2);
            }
        }

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

    // Express Surcharge Calculation (if applied globally or per item? UI applied it to total)
    // In Wizard, we calculated Total = Subtotal * Multiplier.
    // We should show Subtotal and then Surcharge if applicable.
    // For simplicity, we just show Line Items and then Total. 
    // BUT wait, in Wizard, line items are Base Price. The Surcharge is applied at the END.
    // So the line items sum up to "Subtotal" (Standard Prices).
    // And "Total" includes the surcharge.

    // Let's Recalculate Subtotal from items to show the difference
    // Actually, order.totalAmount is the final one.

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
            .qty { width: 45px; vertical-align: top; }
            .name { flex: 1; text-align: left; vertical-align: top; }
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
            }
            @media print {
                @page { margin: 0; size: auto; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="${window.location.origin + Logo}" alt="Washouse" style="width: 60px; height: auto; margin-bottom: 10px;" />
            <div class="title">WASHOUSE</div>
            <div class="info">Orden: #${orderId}</div>
            <div class="info">${new Date(createdAt).toLocaleString()}</div>
            <div class="info" style="font-weight:bold; margin-top:5px;">${customerName}</div>
            <div class="info">${customerPhone}</div>
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
            <p>¡Gracias por su preferencia!</p>
            <p style="text-align:left; margin-top:10px;">
                <strong>Condiciones:</strong><br/>
                1. Reclamos solo dentro de 24h.<br/>
                2. No respondemos por botones/cierres.<br/>
                3. Ropa abandonada 30 días se dona.
            </p>
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
