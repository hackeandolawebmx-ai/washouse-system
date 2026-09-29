export const PERIOD_OPTIONS = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'lastMonth', label: 'Mes pasado' },
    { id: 'custom', label: 'Personalizado' }
];

// Rango [start, end] en hora local. La semana empieza en lunes.
export function periodRange(period, customStart, customEnd) {
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (period) {
        case 'today':
            return { start: startOfDay(now), end: endOfDay(now) };
        case 'week': {
            const monday = startOfDay(now);
            monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
            return { start: monday, end: endOfDay(now) };
        }
        case 'lastMonth':
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
            };
        case 'custom':
            if (customStart && customEnd) {
                return {
                    start: startOfDay(new Date(`${customStart}T00:00:00`)),
                    end: endOfDay(new Date(`${customEnd}T00:00:00`))
                };
            }
            return periodRange('month');
        case 'month':
        default:
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: endOfDay(now)
            };
    }
}

export const inRange = (value, { start, end }) => {
    const d = new Date(value);
    return d >= start && d <= end;
};

// Días del rango como 'YYYY-MM-DD' en hora local, para la gráfica diaria.
export function daysInRange({ start, end }) {
    const days = [];
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (d <= end && days.length < 400) {
        days.push(localDayKey(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

export const localDayKey = (value) => {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
