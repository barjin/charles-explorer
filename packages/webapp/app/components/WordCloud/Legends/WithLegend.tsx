export function WithLegend({ children, legend, className, ...props }) {
    return (
        <div className={`relative ${className ?? ''}`}>
            <div className="absolute top-3 right-3 z-50">
                {legend}
            </div>
            {children}
        </div>
    );
}