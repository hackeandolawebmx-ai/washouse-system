import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { buscarOrdenPorFolio, enviarSolicitudFactura, folioCorto } from '../lib/publicData';
import { Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import logo from '../assets/WasHouse CYMK.png';

export default function RequestInvoicePage() {
    const [folio, setFolio] = useState('');
    const [foundOrder, setFoundOrder] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [rfc, setRfc] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [done, setDone] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError('');
        setFoundOrder(null);

        if (!folio.trim()) return;

        setSearching(true);
        try {
            const match = await buscarOrdenPorFolio(folio);
            if (!match) {
                setSearchError('No encontramos ese folio. Verifica el número que aparece junto a "Orden #" en tu ticket.');
                return;
            }
            setFoundOrder(match);
        } catch {
            setSearchError('No pudimos consultar tu folio en este momento. Intenta de nuevo en un minuto.');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!rfc.trim() || !razonSocial.trim()) {
            setSubmitError('El RFC y la razón social son obligatorios.');
            return;
        }

        setSubmitting(true);
        try {
            await enviarSolicitudFactura({
                orderId: foundOrder.id,
                branchId: foundOrder.branchId,
                rfc: rfc.trim().toUpperCase(),
                razonSocial: razonSocial.trim(),
                email: email.trim()
            });
            setDone(true);
        } catch (err) {
            setSubmitError(err.message || 'No se pudo enviar tu solicitud. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-washouse-gradient flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
                <div className="bg-white/80 backdrop-blur-md p-8 text-center border-b border-gray-100/50">
                    <img src={logo} alt="Washouse" className="h-20 w-auto mx-auto object-contain mb-4" />
                    <div className="space-y-1">
                        <h1 className="text-xl font-black text-black tracking-tight uppercase">Solicitar Factura</h1>
                        <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Ingresa el folio de tu ticket</p>
                    </div>
                </div>

                <div className="p-8">
                    {done ? (
                        <div className="text-center space-y-4 py-4">
                            <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
                            <h2 className="text-lg font-black text-washouse-navy">¡Solicitud enviada!</h2>
                            <p className="text-sm text-gray-500">
                                Recibimos tu solicitud de factura para la orden #{folioCorto(foundOrder.id)}.
                                Nuestro equipo la generará y te la haremos llegar a la brevedad.
                            </p>
                        </div>
                    ) : !foundOrder ? (
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-2">Folio de tu ticket</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                    <input
                                        id="folio"
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                                        placeholder="Ej. 552971"
                                        value={folio}
                                        onChange={(e) => { setFolio(e.target.value); setSearchError(''); }}
                                    />
                                </div>
                                {searchError && (
                                    <div className="flex items-start gap-2 mt-2 text-red-500 text-sm">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{searchError}</span>
                                    </div>
                                )}
                            </div>
                            <Button type="submit" loading={searching} className="w-full py-4 text-lg shadow-lg">
                                Buscar mi orden
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <FileText className="text-washouse-blue shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-black text-washouse-navy">Orden #{folioCorto(foundOrder.id)}</p>
                                    <p className="text-gray-500">{foundOrder.customerLabel} · {foundOrder.branchName}</p>
                                    <p className="text-gray-500">{new Date(foundOrder.createdAt).toLocaleDateString('es-MX')} · {formatCurrency(foundOrder.totalAmount)}</p>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="rfc" className="block text-sm font-medium text-gray-700 mb-2">RFC</label>
                                <input
                                    id="rfc"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all uppercase"
                                    placeholder="XAXX010101000"
                                    value={rfc}
                                    onChange={(e) => setRfc(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="razon-social" className="block text-sm font-medium text-gray-700 mb-2">Razón social</label>
                                <input
                                    id="razon-social"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                                    placeholder="Nombre o razón social como aparece en tu constancia fiscal"
                                    value={razonSocial}
                                    onChange={(e) => setRazonSocial(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo (opcional)</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                                    placeholder="Para enviarte tu factura"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {submitError && (
                                <div className="flex items-start gap-2 text-red-500 text-sm">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <Button type="submit" loading={submitting} className="w-full py-4 text-lg shadow-lg">
                                Enviar solicitud
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setFoundOrder(null); setFolio(''); }}
                                className="w-full text-center text-gray-400 hover:text-washouse-blue text-sm font-medium transition-colors"
                            >
                                Buscar otro folio
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
