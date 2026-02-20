import { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Plus, Search, Filter } from 'lucide-react';
import NewOrderWizard from '../components/services/NewOrderWizard';
import OrderKanban from '../components/services/OrderKanban';

export default function ServiceReception() {
    const { deviceBranchId } = useStorage();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-blue-500/5 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-washouse-navy italic tracking-tight">Servicios Programados</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mostrador de Recepción y Entrega</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-washouse-blue transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o folio..."
                            className="pl-12 pr-6 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl w-full md:w-72 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400/30 focus:bg-white transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="bg-washouse-blue text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_8px_20px_rgba(0,144,215,0.2)] hover:shadow-[0_12px_25px_rgba(0,144,215,0.3)] transform transition-all active:scale-95 flex items-center gap-3"
                    >
                        <Plus size={20} /> Nueva Orden
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <OrderKanban searchTerm={searchTerm} />
            </div>

            {/* Wizard Modal */}
            {isWizardOpen && (
                <NewOrderWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                />
            )}
        </div>
    );
}
