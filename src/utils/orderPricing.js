// Precio de un servicio por peso con tabla de tarifas (weightBrackets): el
// peso cae en el primer tramo cuyo maxKg lo cubre y se cobra el precio de
// ESE tramo completo, no una fórmula lineal — así es como está publicada la
// tarifa física en la sucursal (ver 20260928_wash_dry_tarifa_por_kilos.sql):
// de 5 a 8 kg el precio sube por kilo, pero de 8 a 8.5 kg salta de golpe
// porque pasa de "1 carga" a "2 cargas". Arriba del último tramo, seguir
// sumando extraPerKg por cada kilo adicional (redondeado hacia arriba).
// Devuelve null si el item no trae tabla de tarifas, para que el llamador
// caiga al cálculo genérico.
function priceFromWeightBrackets(item, weight) {
    const brackets = item.weightBrackets;
    if (!Array.isArray(brackets) || brackets.length === 0) return null;

    const hit = brackets.find(b => weight <= b.maxKg);
    if (hit) return hit.price;

    const last = brackets[brackets.length - 1];
    const extraKg = Math.ceil(weight - last.maxKg);
    return last.price + extraKg * (item.extraPerKg || 0);
}

// Precio de un renglón de orden. weightBrackets (si el servicio la trae, p.
// ej. Lavado y secado) manda sobre cualquier otra regla; si no la trae, se
// usan las reglas anteriores tal cual estaban.
export function calculateOrderItemTotal(item) {
    const isWeight = item.type === 'weight';
    const basePrice = item.price || item.basePrice || 0;

    if (!isWeight) {
        return basePrice * item.quantity;
    }

    const bracketPrice = priceFromWeightBrackets(item, item.quantity);
    if (bracketPrice !== null) return bracketPrice;

    // Carga estándar (Lavadora / Secadora de autoservicio): cada ~6 kg es
    // una carga nueva, se cobra por carga y no por kilo exacto.
    if (item.serviceId === 'self_wash' || item.serviceId === 'wash_std') {
        const numLoads = Math.ceil(item.quantity / 5.999) || 1;
        const avgWeightPerLoad = item.quantity / numLoads;
        let total = numLoads * basePrice;
        if (avgWeightPerLoad > (item.baseKg || 5)) {
            total += numLoads * (item.extraPrice || 10);
        }
        return total;
    }

    // Genérico: precio base hasta baseKg, después extraPrice por kilo.
    if (item.quantity <= (item.baseKg || 5)) {
        return basePrice;
    }
    return basePrice + (Math.ceil(item.quantity - (item.baseKg || 5)) * (item.extraPrice || 10));
}

// Converts an order's items (weight-tiered, non-linear pricing) into invoice
// line items. Each order line becomes one invoice line at its already-computed
// total, since a per-kg unit price wouldn't reflect the real tiered charge.
export function orderItemsToInvoiceItems(items) {
    return (Array.isArray(items) ? items : []).map(item => ({
        name: item.name,
        description: item.name,
        qty: 1,
        price: calculateOrderItemTotal(item)
    }));
}
