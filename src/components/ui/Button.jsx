export default function Button({ children, variant = 'primary', className = '', ...props }) {
    const baseStyles = "px-4 py-3 rounded-lg font-medium transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-washouse-blue text-white hover:bg-washouse-primary-hover border border-transparent",
        secondary: "bg-washouse-aqua text-white hover:bg-washouse-secondary-hover border border-transparent",
        outline: "bg-transparent border-2 border-washouse-blue text-washouse-blue hover:bg-blue-50"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
