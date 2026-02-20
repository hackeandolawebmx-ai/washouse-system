import { useStorage } from '../../context/StorageContext';
import Button from './Button';
import { Package, AlertTriangle } from 'lucide-react';

export default function InventoryModal({ onClose }) {
    const { inventory, deviceBranchId } = useStorage();

    // Filter by current branch
    const currentBranchInventory = inventory.filter(p => p.branchId === (deviceBranchId || 'main'));

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
                {currentBranchInventory.map(product => {
                    const isLowStock = product.stock < 10;
                    return (
                        <div key={product.id} className="glass-surface p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center">
                                <div className="bg-white p-3 rounded-xl mr-4 text-3xl shadow-sm group-hover:scale-110 transition-transform">
                                    {product.icon}
                                </div>
                                <div>
                                    <h4 className="font-black text-washouse-navy italic leading-none">{product.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">PVP: ${product.price}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`text-2xl font-black ${isLowStock ? 'text-amber-500' : 'text-washouse-blue'} tracking-tighter`}>
                                    {product.stock}
                                </div>
                                <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                    Unidades
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50/50 p-5 rounded-2xl flex items-start border border-blue-100/50 shadow-inner">
                <AlertTriangle className="text-washouse-blue w-5 h-5 mr-4 mt-0.5" />
                <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
                    <strong className="text-blue-900 uppercase tracking-wider block mb-1">Nota de Control</strong>
                    Esta vista es de lectura sincronizada. Los movimientos manuales de inventario se gestionan desde el panel de administración.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={onClose} className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-200">
                    Entendido
                </Button>
            </div>
        </div>
    );
}
