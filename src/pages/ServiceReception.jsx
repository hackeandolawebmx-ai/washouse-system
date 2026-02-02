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
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-washouse-navy">Servicios Programados</h1>
                    <p className="text-gray-500 text-sm">Mostrador de Recepción y Entrega</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar orden / cliente..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 ring-washouse-blue outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="bg-washouse-blue text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={24} /> Nueva Orden
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
