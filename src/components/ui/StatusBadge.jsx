export default function StatusBadge({ status }) {
    const styles = {
        RECEIVED: 'bg-gray-100 text-gray-600',
        WASHING: 'bg-blue-100 text-blue-700',
        DRYING: 'bg-orange-100 text-orange-700',
        IRONING: 'bg-purple-100 text-purple-700',
        COMPLETED: 'bg-green-100 text-green-700',
        DELIVERED: 'bg-gray-200 text-gray-800 line-through decoration-gray-400',
        // Machine Statuses
        available: 'bg-green-100 text-green-700',
        running: 'bg-blue-100 text-blue-700',
        finished: 'bg-orange-100 text-orange-700',
        maintenance: 'bg-red-100 text-red-700'
    };

    const labels = {
        RECEIVED: 'Recibido',
        WASHING: 'Lavando',
        DRYING: 'Secando',
        IRONING: 'Planchando',
        COMPLETED: 'Listo',
        DELIVERED: 'Entregado',
        // Machine Statuses
        available: 'Disponible',
        running: 'En Uso',
        finished: 'Terminado',
        maintenance: 'Mantenimiento'
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
}
