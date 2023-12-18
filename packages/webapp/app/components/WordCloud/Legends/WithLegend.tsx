export function WithLegend({ onContextMenu, r, children, legend, className, ...props }) {
    return (
        <div ref={r} className={`relative ${className ?? ''}`} onContextMenu={onContextMenu}>
            <div className="absolute top-3 left-3 z-50">
                {legend}
            </div>
            {children}
        </div>
    );
}