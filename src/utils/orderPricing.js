// Weight-tiered pricing: a flat basePrice covers up to baseKg (default 5kg),
// extraPrice per kg beyond that. self_wash/wash_std bill per load instead of
// per kg once the load exceeds ~6kg. Mirrors the logic used when the order
// was priced in NewOrderWizard.
export function calculateOrderItemTotal(item) {
    const isWeight = item.type === 'weight';
    const basePrice = item.price || item.basePrice || 0;

    if (!isWeight) {
        return basePrice * item.quantity;
    }

    if (item.serviceId === 'self_wash' || item.serviceId === 'wash_std') {
        const numLoads = Math.ceil(item.quantity / 5.999) || 1;
        const avgWeightPerLoad = item.quantity / numLoads;
        let total = numLoads * basePrice;
        if (avgWeightPerLoad > (item.baseKg || 5)) {
            total += numLoads * (item.extraPrice || 10);
        }
        return total;
    }

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
