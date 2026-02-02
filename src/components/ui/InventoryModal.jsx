import { useStorage } from '../../context/StorageContext';
import Button from './Button';
import { Package, AlertTriangle } from 'lucide-react';

export default function InventoryModal({ onClose }) {
    const { inventory, deviceBranchId } = useStorage();

    // Filter by current branch
    const currentBranchInventory = inventory.filter(p => p.branchId === (deviceBranchId || 'main'));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {currentBranchInventory.map(product => {
                    const isLowStock = product.stock < 10;
                    return (
                        <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-blue-50 p-2 rounded-lg mr-4 text-2xl">
                                    {product.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-washouse-navy">{product.name}</h4>
                                    <p className="text-sm text-gray-500">Precio: ${product.price}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`text-xl font-bold ${isLowStock ? 'text-amber-500' : 'text-washouse-blue'}`}>
                                    {product.stock}
                                </div>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                    En Stock
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                <AlertTriangle className="text-washouse-blue w-5 h-5 mr-3 mt-0.5" />
                <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Esta vista es actualmente de lectura. El descuento de inventario se implementará en la siguiente fase de conexión con base de datos.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    );
}
