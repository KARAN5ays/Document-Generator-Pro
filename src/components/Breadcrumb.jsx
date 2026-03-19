
/**
 * Breadcrumb — matches the exact style used in TemplateBuilder.
 * Usage: <Breadcrumb items={[{ label: 'Dashboard', onClick: () => onNavigate('dashboard') }, { label: 'Asset Manager' }]} />
 */
export default function Breadcrumb({ items = [] }) {
    return (
        <div className="flex items-center gap-1.5 text-sm text-brand-purple mb-1">
            {items.map((item, idx) => {
                const isLast = idx === items.length - 1
                return (
                    <span key={idx} className="flex items-center gap-2">
                        {idx > 0 && <span className="text-slate-400 font-normal">/</span>}
                        {isLast ? (
                            <span className="font-light text-brand-purple">{item.label}</span>
                        ) : (
                            <button
                                onClick={item.onClick}
                                className="hover:text-brand-pink transition-all font-light"
                            >
                                {item.label}
                            </button>
                        )}
                    </span>
                )
            })}
        </div>
    )
}
