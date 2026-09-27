import { Fragment, useEffect, useState } from 'react';
import { BookOpen, Printer, Info, AlertTriangle, ChevronDown } from 'lucide-react';

/**
 * Muestra un manual definido como datos (src/data/manuals/*.js). El mismo
 * componente sirve para el mostrador y para administración, así que los dos
 * manuales se ven y se comportan igual.
 */

// '**negritas**' → <strong>. Es lo único que admite el texto de los manuales.
function Rich({ text }) {
    const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-black text-washouse-navy">{part.slice(2, -2)}</strong>
            : <Fragment key={i}>{part}</Fragment>
    );
}

function Block({ block }) {
    switch (block.type) {
        case 'p':
            return <p className="text-[15px] leading-relaxed text-gray-600 max-w-2xl"><Rich text={block.text} /></p>;

        case 'list':
            return (
                <ul className="flex flex-col gap-2.5 max-w-2xl">
                    {block.items.map((item, i) => (
                        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-gray-600">
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-washouse-blue shrink-0" />
                            <span><Rich text={item} /></span>
                        </li>
                    ))}
                </ul>
            );

        case 'steps':
            return (
                <ol className="flex flex-col gap-4 max-w-2xl">
                    {block.items.map((step, i) => (
                        <li key={i} className="grid grid-cols-[2rem_1fr] gap-4 items-start">
                            <span className="w-8 h-8 rounded-full bg-blue-50 text-washouse-blue font-black text-sm flex items-center justify-center tabular-nums">
                                {i + 1}
                            </span>
                            <div className="pt-1">
                                <p className="font-black text-washouse-navy text-[15px] leading-snug"><Rich text={step.title} /></p>
                                {step.text && <p className="text-sm text-gray-500 leading-relaxed mt-1"><Rich text={step.text} /></p>}
                            </div>
                        </li>
                    ))}
                </ol>
            );

        case 'note': {
            const warn = block.tone === 'warn';
            const Icon = warn ? AlertTriangle : Info;
            return (
                <div className={`max-w-2xl rounded-2xl border p-5 flex gap-4 break-inside-avoid ${warn ? 'bg-amber-50/60 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
                    <Icon size={20} className={`shrink-0 mt-0.5 ${warn ? 'text-amber-600' : 'text-washouse-blue'}`} />
                    <div>
                        <p className={`font-black text-sm ${warn ? 'text-amber-800' : 'text-washouse-navy'}`}>{block.title}</p>
                        <p className={`text-sm leading-relaxed mt-1 ${warn ? 'text-amber-900/80' : 'text-gray-600'}`}><Rich text={block.text} /></p>
                    </div>
                </div>
            );
        }

        case 'table':
            return (
                <div className="max-w-2xl overflow-x-auto rounded-2xl border border-gray-100 break-inside-avoid">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80">
                                {block.head.map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {block.rows.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j} className={`px-4 py-3 align-top leading-relaxed ${j === 0 ? 'font-bold text-washouse-navy min-w-[9rem]' : 'text-gray-600'}`}>
                                            <Rich text={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'img':
            return (
                <figure className="flex flex-col gap-2 break-inside-avoid">
                    <a href={block.src} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow" title="Abrir en grande">
                        <img src={block.src} alt={block.caption} loading="lazy" width="1280" height="800" className="block w-full h-auto bg-gray-50" />
                    </a>
                    <figcaption className="text-xs text-gray-400 font-medium">{block.caption}</figcaption>
                </figure>
            );

        default:
            return null;
    }
}

export default function ManualView({ manual, kicker }) {
    const [activeId, setActiveId] = useState(manual.sections[0]?.id);

    // Resalta en el índice la sección que se está leyendo.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-15% 0px -70% 0px' }
        );
        manual.sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [manual]);

    const irA = (e, id) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const indice = (
        <ul className="flex flex-col gap-0.5">
            {manual.sections.map((s, i) => (
                <li key={s.id}>
                    <a
                        href={`#${s.id}`}
                        onClick={(e) => irA(e, s.id)}
                        className={`flex gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${activeId === s.id
                            ? 'bg-blue-50 text-washouse-blue font-black'
                            : 'text-gray-500 hover:text-washouse-navy hover:bg-gray-50 font-semibold'}`}
                    >
                        <span className="tabular-nums opacity-50 w-4 shrink-0">{i + 1}</span>
                        {s.title}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="pb-16">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 mb-10 border-b border-gray-100">
                <div className="space-y-3">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-washouse-blue">
                        <BookOpen size={14} /> {kicker}
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black text-washouse-navy tracking-tight font-outfit">{manual.title}</h1>
                    <p className="text-gray-500 font-medium max-w-2xl">{manual.subtitle}</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="print:hidden self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-washouse-blue text-washouse-blue font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shrink-0"
                >
                    <Printer size={16} /> Imprimir
                </button>
            </header>

            {/* Índice en pantallas angostas */}
            <details className="lg:hidden print:hidden mb-8 rounded-2xl border border-gray-100 bg-white group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-black text-sm text-washouse-navy">
                    Índice
                    <ChevronDown size={18} className="text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <nav aria-label="Índice del manual" className="px-2 pb-3">{indice}</nav>
            </details>

            <div className="grid lg:grid-cols-[15rem_1fr] gap-12">
                <aside className="hidden lg:block print:hidden">
                    <nav aria-label="Índice del manual" className="sticky top-28">
                        <p className="px-3 mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Índice</p>
                        {indice}
                    </nav>
                </aside>

                <div className="min-w-0 flex flex-col gap-16">
                    {manual.sections.map((s, i) => (
                        <section key={s.id} id={s.id} className="scroll-mt-28 flex flex-col gap-6">
                            <h2 className="flex items-baseline gap-3 text-2xl font-black text-washouse-navy tracking-tight font-outfit">
                                <span className="text-washouse-blue/40 tabular-nums text-lg">{i + 1}</span>
                                {s.title}
                            </h2>
                            {s.blocks.map((b, j) => <Block key={j} block={b} />)}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
