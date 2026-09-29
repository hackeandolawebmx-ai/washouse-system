import { useState } from 'react';
import { Plus, Search, Wallet } from 'lucide-react';
import NewOrderWizard from '../components/services/NewOrderWizard';
import OrderKanban from '../components/services/OrderKanban';
import ExpenseModal from '../components/ui/ExpenseModal';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import { USUARIO_MOSTRADOR } from '../utils/labels';

export default function ServiceReception() {
    const { isShiftOpen, user } = useAuth();
    const { deviceBranchId, addExpense } = useStorage();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const openExpenseModal = () => {
        if (!isShiftOpen) {
            alert('Debes iniciar turno para registrar gastos');
            return;
        }
        setIsExpenseModalOpen(true);
    };

    return (
        <div className="pb-8">
            <h1 className="sr-only">Por encargo</h1>

            {/* Misma barra fija que el tablero de máquinas: búsqueda y acción principal */}
            <div
                className="sticky z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-gray-100/80"
                style={{ top: 'var(--host-header-h, 0px)' }}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <label className="relative flex-1 min-w-[14rem] max-w-md">
                        <span className="sr-only">Buscar por cliente o folio</span>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            id="buscar-encargo"
                            type="search"
                            placeholder="Buscar por cliente o folio…"
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-washouse-blue/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={openExpenseModal}
                            className="h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap border border-gray-200 bg-white text-slate-700 hover:border-washouse-blue/40 hover:text-washouse-blue transition-colors"
                        >
                            <Wallet size={16} /> Gasto
                        </button>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap bg-washouse-blue text-white hover:bg-washouse-primary-hover shadow-[0_6px_16px_rgba(0,144,215,0.25)] transition-colors"
                        >
                            <Plus size={16} strokeWidth={3} /> Nueva Orden
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-5">
                <OrderKanban searchTerm={searchTerm} />
            </div>

            {isWizardOpen && (
                <NewOrderWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                />
            )}

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={(expenseData) => addExpense({ ...expenseData, branchId: deviceBranchId || 'main' }, user?.name || USUARIO_MOSTRADOR)}
            />
        </div>
    );
}
