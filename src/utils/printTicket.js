import Logo from '../assets/logo.png';

export const printTicket = (order) => {
    if (!order || !order.items) {
        alert("No hay detalles para imprimir.");
        return;
    }

    const {
        customer,
        clientName, // Fallback
        total,
        items,
        id,
        date,
        startDate // Fallback
    } = order;

    // Normalize data
    const finalClientName = customer?.name || clientName || 'Cliente General';
    const finalDate = date || startDate || new Date().toISOString();
    const orderId = id ? id.toString().slice(-4) : 'XXXX';

    // Build items rows
    const itemsHtml = (Array.isArray(items) ? items : Object.entries(items).map(([id, qty]) => ({ id, quantity: qty }))).map(item => {
        const name = item.name || item.id || 'Servicio';
        const type = item.type || 'unit';
        const qty = item.quantity || 1;

        let priceDisplay = '0.00';
        if (item.basePrice || item.price) {
            const basePrice = item.basePrice || item.price;
            const price = type === 'weight' && item.baseKg && qty > item.baseKg
                ? basePrice + ((qty - item.baseKg) * (item.extraPrice || 0))
                : basePrice * qty;
            priceDisplay = price.toFixed(2);
        }

        return `
            <div class="item">
                <span class="qty">${qty}${type === 'weight' ? 'kg' : ''}</span>
                <span class="name">${name}</span>
                <span class="price">$${priceDisplay}</span>
            </div>
        `;
    }).join('');

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
                margin-bottom: 20px;
            }
            .item {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .qty { width: 45px; }
            .name { flex: 1; text-align: left; }
            .price { text-align: right; }
            .total {
                border-top: 1px dashed #000;
                padding-top: 10px;
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 18px;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
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
            <div class="info">Lavandería y Tintorería</div>
            <div class="info">Fecha: ${new Date(finalDate).toLocaleString()}</div>
            <div class="info">Orden: #${orderId}</div>
            <div class="info">Cliente: ${finalClientName}</div>
        </div>
        
        <div class="items">
            ${itemsHtml}
        </div>

        <div class="total">
            <span>TOTAL</span>
            <span>$${total?.toFixed(2)}</span>
        </div>

        <div class="footer">
            <p>¡Gracias por su preferencia!</p>
            <p>Wifi: Washouse_Guest</p>
            <p>Pass: Lavado123</p>
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
