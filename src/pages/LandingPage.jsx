import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerSucursalesPublicas, obtenerServiciosPublicos } from '../lib/publicData';
import { formatCurrency } from '../utils/formatCurrency';
import { SERVICES_CATALOG } from '../data/catalog';
import logo from '../assets/WasHouse CYMK.png';
import {
    MapPin, Clock, Phone, MessageCircle, Receipt,
    WashingMachine, Wind, Shirt, Sparkles, ArrowRight
} from 'lucide-react';

// El orden y la redacción son para un cliente, no para el catálogo interno.
const CATEGORIAS = [
    {
        id: 'self_service',
        titulo: 'Lavado y secado',
        descripcion: 'Déjanos tu ropa y nosotros la lavamos, secamos y doblamos. El precio depende del peso de tu carga.',
        icono: WashingMachine
    },
    {
        id: 'special',
        titulo: 'Edredones y cubre colchones',
        descripcion: 'Lo que no cabe en tu lavadora de casa. Precio por pieza.',
        icono: Wind
    },
    {
        id: 'iron',
        titulo: 'Planchado',
        descripcion: 'Por pieza o por docena, listo para colgar.',
        icono: Shirt
    },
    {
        id: 'fixing',
        titulo: 'Compostura',
        descripcion: 'Bastillas, ajustes y cambios de zipper.',
        icono: Sparkles
    }
];

const soloDigitos = (tel) => (tel || '').replace(/\D/g, '');

export default function LandingPage() {
    const [sucursales, setSucursales] = useState([]);
    const [servicios, setServicios] = useState(SERVICES_CATALOG);
    const [sucursalId, setSucursalId] = useState(null);

    useEffect(() => {
        let vigente = true;

        obtenerSucursalesPublicas()
            .then(data => {
                if (!vigente || !data.length) return;
                setSucursales(data);
                setSucursalId(prev => prev ?? data[0].id);
            })
            .catch(() => { /* la página sigue siendo útil sin el bloque de sucursales */ });

        obtenerServiciosPublicos()
            .then(data => { if (vigente && data.length) setServicios(data); })
            .catch(() => { /* se queda el catálogo de respaldo */ });

        return () => { vigente = false; };
    }, []);

    const sucursal = useMemo(
        () => sucursales.find(s => s.id === sucursalId) || sucursales[0] || null,
        [sucursales, sucursalId]
    );

    const porCategoria = useMemo(() => {
        const mapa = {};
        servicios.forEach(s => {
            (mapa[s.category] ||= []).push(s);
        });
        Object.values(mapa).forEach(lista => lista.sort((a, b) => a.price - b.price));
        return mapa;
    }, [servicios]);

    const whatsapp = sucursal?.phone
        ? `https://wa.me/52${soloDigitos(sucursal.phone)}?text=${encodeURIComponent('Hola, quiero información sobre sus servicios de lavandería.')}`
        : null;

    return (
        <div className="min-h-screen bg-washouse-subtle font-sans text-gray-800">

            {/* ---------------- Encabezado ---------------- */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <img src={logo} alt="Washouse" className="h-12 w-auto object-contain" />
                    <nav className="flex items-center gap-2 sm:gap-6">
                        <a href="#precios" className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-washouse-blue transition-colors">
                            Precios
                        </a>
                        <a href="#sucursales" className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-washouse-blue transition-colors">
                            Sucursales
                        </a>
                        <Link
                            to="/solicitar-factura"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-100 shadow-sm text-[11px] font-black uppercase tracking-widest text-washouse-blue hover:shadow-md transition-all active:scale-95"
                        >
                            <Receipt size={16} /> Facturar
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ---------------- Portada ---------------- */}
            <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
                <div className="max-w-3xl space-y-6">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-washouse-blue bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                        Lavandería en Monterrey
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-black text-washouse-navy tracking-tighter leading-[1.05] text-balance">
                        Deja tu ropa. Nosotros hacemos el resto.
                    </h1>
                    <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Lavado, secado, planchado y compostura. Te avisamos por WhatsApp
                        en cuanto esté lista y la recoges cuando te quede bien.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <a
                            href="#sucursales"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-washouse-blue text-white font-black uppercase tracking-widest text-xs shadow-[0_8px_20px_rgba(0,144,215,0.25)] hover:shadow-[0_12px_28px_rgba(0,144,215,0.35)] transition-all active:scale-95"
                        >
                            Ver sucursales <ArrowRight size={18} />
                        </a>
                        <a
                            href="#precios"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-gray-100 text-washouse-navy font-black uppercase tracking-widest text-xs shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            Consultar precios
                        </a>
                    </div>
                </div>
            </section>

            {/* ---------------- Cómo funciona ---------------- */}
            <section className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { n: '1', t: 'Nos traes tu ropa', d: 'La pesamos y la registramos frente a ti. Te damos un ticket con tu folio.' },
                        { n: '2', t: 'La lavamos y doblamos', d: 'La mayoría de las órdenes quedan el mismo día.' },
                        { n: '3', t: 'Te avisamos', d: 'Recibes un WhatsApp cuando está lista y pasas por ella.' }
                    ].map(paso => (
                        <div key={paso.n} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-washouse-blue flex items-center justify-center font-black text-xl mb-5">
                                {paso.n}
                            </div>
                            <h3 className="font-black text-washouse-navy text-lg mb-2 tracking-tight">{paso.t}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{paso.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------------- Precios ---------------- */}
            <section id="precios" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-24">
                <div className="mb-10 space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-washouse-navy tracking-tighter">Precios</h2>
                    <p className="text-gray-500 font-medium max-w-2xl">
                        Los mismos que cobramos en mostrador. Si necesitas factura, te la damos:
                        el IVA se agrega al momento de pagar.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CATEGORIAS.map(cat => {
                        const lista = porCategoria[cat.id] || [];
                        if (!lista.length) return null;
                        const Icono = cat.icono;

                        return (
                            <div key={cat.id} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-washouse-blue flex items-center justify-center shrink-0">
                                        <Icono size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-washouse-navy text-lg tracking-tight leading-tight">{cat.titulo}</h3>
                                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{cat.descripcion}</p>
                                    </div>
                                </div>

                                <dl className="flex flex-col divide-y divide-gray-50 mt-auto">
                                    {lista.map(s => (
                                        <div key={s.id} className="flex items-baseline justify-between gap-4 py-3">
                                            <dt className="text-sm font-bold text-gray-600">
                                                {s.name}
                                                {s.type === 'weight' && (
                                                    <span className="text-gray-300 font-medium">
                                                        {' · '}{s.weightBrackets ? 'tarifa por kilo' : `hasta ${s.baseKg || 5} kg`}
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className="font-black text-washouse-blue tabular-nums shrink-0">
                                                {s.weightBrackets && <span className="text-gray-400 font-bold text-xs mr-1">Desde</span>}
                                                {formatCurrency(s.price)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-gray-400 mt-6 font-medium">
                    Los servicios por kilo se cobran por carga: al pasar de 5 kg se agrega el excedente correspondiente.
                    Pregunta en mostrador por el precio exacto de tu carga.
                </p>
            </section>

            {/* ---------------- Sucursales ---------------- */}
            <section id="sucursales" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-24">
                <div className="mb-10 space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-washouse-navy tracking-tighter">Sucursales</h2>
                    <p className="text-gray-500 font-medium">Elige la que te quede más cerca.</p>
                </div>

                {sucursales.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
                        <p className="text-gray-400 font-bold">
                            Escríbenos por WhatsApp y te decimos cuál te queda más cerca.
                        </p>
                    </div>
                ) : (
                    <>
                        {sucursales.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {sucursales.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSucursalId(s.id)}
                                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${s.id === sucursal?.id
                                            ? 'bg-washouse-blue text-white shadow-[0_8px_20px_rgba(0,144,215,0.25)]'
                                            : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-600 hover:shadow-sm'
                                            }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {sucursal && (
                            <div className="bg-white rounded-3xl border border-gray-100 p-8 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-washouse-navy tracking-tight">{sucursal.name}</h3>

                                    <div className="space-y-4">
                                        {sucursal.address && (
                                            <div className="flex items-start gap-3">
                                                <MapPin size={18} className="text-washouse-blue shrink-0 mt-0.5" />
                                                <span className="text-gray-600 text-sm leading-relaxed">{sucursal.address}</span>
                                            </div>
                                        )}
                                        {sucursal.hours && (
                                            <div className="flex items-start gap-3">
                                                <Clock size={18} className="text-washouse-blue shrink-0 mt-0.5" />
                                                <span className="text-gray-600 text-sm leading-relaxed">{sucursal.hours}</span>
                                            </div>
                                        )}
                                        {sucursal.phone && (
                                            <div className="flex items-start gap-3">
                                                <Phone size={18} className="text-washouse-blue shrink-0 mt-0.5" />
                                                <a href={`tel:${soloDigitos(sucursal.phone)}`} className="text-gray-600 text-sm hover:text-washouse-blue transition-colors">
                                                    {sucursal.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 justify-center">
                                    {whatsapp && (
                                        <a
                                            href={whatsapp}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:bg-emerald-600 transition-all active:scale-95"
                                        >
                                            <MessageCircle size={18} /> Escríbenos por WhatsApp
                                        </a>
                                    )}
                                    {sucursal.mapsUrl && (
                                        <a
                                            href={sucursal.mapsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-gray-100 text-washouse-navy font-black uppercase tracking-widest text-xs shadow-sm hover:shadow-md transition-all active:scale-95"
                                        >
                                            <MapPin size={18} /> Cómo llegar
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ---------------- Factura ---------------- */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <div className="bg-washouse-navy rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                    <div className="space-y-2 max-w-xl">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">¿Necesitas tu factura?</h2>
                        <p className="text-blue-100/80 font-medium leading-relaxed">
                            Ten a la mano el folio de tu ticket, el número que aparece junto a
                            &ldquo;Orden #&rdquo;. Con eso la solicitas en un minuto.
                        </p>
                    </div>
                    <Link
                        to="/solicitar-factura"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-washouse-navy font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0"
                    >
                        <Receipt size={18} /> Solicitar factura
                    </Link>
                </div>
            </section>

            {/* ---------------- Pie ---------------- */}
            <footer className="border-t border-gray-100 bg-white">
                <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src={logo} alt="Washouse" className="h-10 w-auto object-contain" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-300">
                        Washouse · Lavar · Secar · Planchar
                    </p>
                </div>
            </footer>
        </div>
    );
}
