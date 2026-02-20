import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
    Users, UserPlus, Shield, MapPin,
    Trash2, Edit2, Key, Check,
    X, AlertCircle, Search
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function StaffManagement() {
    const {
        staff, branches, addStaffMember,
        updateStaffMember, deleteStaffMember
    } = useStorage();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state for new/edit
    const [formData, setFormData] = useState({
        name: '',
        role: 'operator',
        pin: '',
        branchId: 'main'
    });

    const resetForm = () => {
        setFormData({ name: '', role: 'operator', pin: '', branchId: 'main' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = () => {
        if (!formData.name || !formData.pin) {
            alert('Por favor completa el nombre y el PIN');
            return;
        }

        if (editingId) {
            updateStaffMember(editingId, formData);
        } else {
            addStaffMember(formData);
        }
        resetForm();
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            role: member.role,
            pin: member.pin,
            branchId: member.branchId
        });
        setEditingId(member.id);
        setIsAdding(true);
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-3">
                        <Users className="text-washouse-blue" size={32} />
                        Gestión de Personal
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Administra accesos, roles y sucursales de tu equipo.</p>
                </div>

                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                        <UserPlus size={18} /> Nuevo Empleado
                    </Button>
                )}
            </div>

            {isAdding ? (
                /* Add/Edit Form */
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 mb-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-black">
                            {editingId ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                        </h2>
                        <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-washouse-blue/20 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PIN de Seguridad (4 dígitos)</label>
                                <div className="relative">
                                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={formData.pin}
                                        onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="****"
                                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-washouse-blue/20 transition-all font-black tracking-[0.5em]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nivel de Acceso (Rol)</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-washouse-blue/20 transition-all font-bold"
                                >
                                    <option value="operator">Operador (Solo Host)</option>
                                    <option value="supervisor">Supervisor (Host + Ajustes)</option>
                                    <option value="admin">Administrador (Control Total)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sucursal Asignada</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={formData.branchId}
                                        onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-washouse-blue/20 transition-all font-bold"
                                    >
                                        <option value="all">Todas las Sucursales</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-10">
                        <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                        <Button onClick={handleSave} className="flex items-center gap-2">
                            <Check size={18} /> {editingId ? 'Actualizar Cambios' : 'Guardar Colaborador'}
                        </Button>
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o rol..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-washouse-blue/10 transition-all font-medium"
                        />
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sucursal</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">PIN</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStaff.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${member.role === 'admin' ? 'bg-washouse-navy' :
                                                        member.role === 'supervisor' ? 'bg-washouse-blue' : 'bg-washouse-aqua'
                                                    }`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span className="font-black text-black">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className={
                                                    member.role === 'admin' ? 'text-red-500' :
                                                        member.role === 'supervisor' ? 'text-washouse-blue' : 'text-gray-400'
                                                } />
                                                <span className="text-sm font-bold text-gray-600 capitalize">{member.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-gray-500">
                                                {member.branchId === 'all' ? 'Acceso Global' : (branches.find(b => b.id === member.branchId)?.name || 'N/A')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-xs font-black tracking-widest bg-gray-100 px-3 py-1 rounded-lg text-gray-400 group-hover:text-washouse-navy transition-colors italic">
                                                ****
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-2 text-gray-400 hover:text-washouse-blue hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Eliminar a ${member.name}?`)) deleteStaffMember(member.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredStaff.length === 0 && (
                            <div className="py-20 text-center">
                                <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-400 font-bold">No se encontraron colaboradores</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
