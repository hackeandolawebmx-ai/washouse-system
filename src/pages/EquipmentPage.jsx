import { useStorage } from '../context/StorageContext';
import EquipmentControlTable from '../components/admin/EquipmentControlTable';
import { machineStatusLabel } from '../utils/labels';

export default function EquipmentPage() {
    const { machines, updateMachine } = useStorage();

    const handleToggleMaintenance = (id) => {
        const machine = machines.find(m => m.id === id);
        if (!machine) return;
        if (machine.status === 'running' && !confirm('⚠️ La máquina está en uso. ¿Continuar?')) return;

        const newStatus = machine.status === 'maintenance' ? 'available' : 'maintenance';
        updateMachine(id, {
            status: newStatus,
            ...(newStatus === 'available' ? { timeLeft: 0, clientName: null, total: 0 } : {})
        });
    };

    const handleForceStop = (id) => {
        if (confirm('⚠️ ¿Detener forzosamente?')) updateMachine(id, { status: 'finished', timeLeft: 0 });
    };

    const handleViewDetails = (id) => {
        const m = machines.find(x => x.id === id);
        alert(`Equipo: ${m.name}\nEstado: ${machineStatusLabel(m.status)}\nCliente: ${m.clientName || 'Sin cliente'}`);
    };

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="glass-card border-white/60 shadow-md overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                    <h1 className="text-xl font-black text-washouse-navy font-outfit tracking-tight uppercase">Equipos</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Estado en tiempo real por sucursal</p>
                </div>
                <EquipmentControlTable
                    onToggleMaintenance={handleToggleMaintenance}
                    onForceStop={handleForceStop}
                    onViewDetails={handleViewDetails}
                />
            </div>
        </div>
    );
}
