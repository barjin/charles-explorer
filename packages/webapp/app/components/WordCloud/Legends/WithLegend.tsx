export function WithLegend({ children, legend, className, ...props }) {
    return (
        <div className={`relative ${className ?? ''}`}>
            <div className="absolute top-3 right-3">
                {legend}
            </div>
            {children}
        </div>
    );
}